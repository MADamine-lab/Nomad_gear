# gear/views.py

from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Count

from gear.models import Category, GearKit, GearReview, GearImage, GearAvailability
from .serializers import (
    CategorySerializer, GearListSerializer, GearDetailSerializer,
    GearCreateUpdateSerializer, GearReviewSerializer, GearImageSerializer,
    GearAvailabilitySerializer, GearPricingSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticatedOrReadOnly()]


class GearKitPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100


class GearKitViewSet(viewsets.ModelViewSet):
    queryset = GearKit.objects.select_related('category').prefetch_related('reviews', 'additional_images')
    pagination_class = GearKitPagination
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]  # Removed DjangoFilterBackend
    search_fields = ['name', 'description', 'brand']
    ordering_fields = ['created_at', 'rating', 'daily_price']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GearDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return GearCreateUpdateSerializer
        return GearListSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticatedOrReadOnly()]
    
    def get_queryset(self):
        queryset = GearKit.objects.select_related('category').prefetch_related('reviews', 'additional_images')
        
        # Manual category filtering (handles both name and slug)
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(
                Q(category__name__iexact=category) | 
                Q(category__slug__iexact=category.lower())
            )
        
        # Status filter
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Featured filter
        is_featured = self.request.query_params.get('is_featured', None)
        if is_featured:
            queryset = queryset.filter(is_featured=is_featured.lower() == 'true')
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_gear = GearKit.objects.filter(is_featured=True, status='available')
        serializer = self.get_serializer(featured_gear, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        category = request.query_params.get('category', '')
        min_price = request.query_params.get('min_price', '')
        max_price = request.query_params.get('max_price', '')
        min_rating = request.query_params.get('min_rating', '')
        
        queryset = GearKit.objects.filter(status='available')
        
        if query:
            queryset = queryset.filter(Q(name__icontains=query) | Q(description__icontains=query))
        
        if category:
            queryset = queryset.filter(
                Q(category__name__iexact=category) | 
                Q(category__slug__iexact=category.lower())
            )
        
        if min_price:
            queryset = queryset.filter(daily_price__gte=min_price)
        
        if max_price:
            queryset = queryset.filter(daily_price__lte=max_price)
        
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def check_availability(self, request, slug=None):
        gear = self.get_object()
        serializer = GearPricingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        quantity = serializer.validated_data['quantity']
        
        unavailable_dates = []
        current_date = start_date
        
        while current_date < end_date:
            availability = GearAvailability.objects.filter(
                gear=gear,
                date=current_date
            ).first()
            
            available_qty = availability.available_quantity if availability else gear.quantity_available
            
            if available_qty < quantity:
                unavailable_dates.append(str(current_date))
            
            current_date += timedelta(days=1)
        
        num_days = (end_date - start_date).days
        
        daily_cost = gear.daily_price * quantity * num_days
        weekly_cost = (gear.weekly_price * quantity * (num_days // 7)) + (gear.daily_price * quantity * (num_days % 7))
        monthly_cost = (gear.monthly_price * quantity * (num_days // 30)) + (gear.daily_price * quantity * (num_days % 30))
        
        best_price = min(daily_cost, weekly_cost, monthly_cost)
        
        return Response({
            'gear_id': gear.id,
            'gear_name': gear.name,
            'available': len(unavailable_dates) == 0,
            'unavailable_dates': unavailable_dates,
            'num_days': num_days,
            'quantity': quantity,
            'pricing': {
                'daily_calculation': float(daily_cost),
                'weekly_calculation': float(weekly_cost),
                'monthly_calculation': float(monthly_cost),
                'best_price': float(best_price),
            },
            'currency': gear.currency
        })
    
    @action(detail=True, methods=['get'])
    def similar(self, request, slug=None):
        gear = self.get_object()
        similar_gear = GearKit.objects.filter(
            category=gear.category,
            status='available'
        ).exclude(id=gear.id)[:6]
        
        serializer = self.get_serializer(similar_gear, many=True)
        return Response(serializer.data)


class GearReviewViewSet(viewsets.ModelViewSet):
    serializer_class = GearReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        gear_slug = self.kwargs.get('gear_slug')
        if gear_slug:
            gear = get_object_or_404(GearKit, slug=gear_slug)
            return GearReview.objects.filter(gear=gear)
        return GearReview.objects.all()
    
    def perform_create(self, serializer):
        gear_slug = self.kwargs.get('gear_slug')
        gear = get_object_or_404(GearKit, slug=gear_slug)
        
        existing_review = GearReview.objects.filter(gear=gear, user=self.request.user).first()
        if existing_review:
            raise serializers.ValidationError('You have already reviewed this gear')
        
        serializer.save(gear=gear, user=self.request.user)
        
        avg_rating = GearReview.objects.filter(gear=gear).aggregate(Avg('rating'))['rating__avg']
        review_count = GearReview.objects.filter(gear=gear).count()
        gear.rating = avg_rating or 0
        gear.review_count = review_count
        gear.save(update_fields=['rating', 'review_count'])
    
    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        reviews = GearReview.objects.filter(user=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)


class GearImageViewSet(viewsets.ModelViewSet):
    serializer_class = GearImageSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        gear_slug = self.kwargs.get('gear_slug')
        if gear_slug:
            gear = get_object_or_404(GearKit, slug=gear_slug)
            return GearImage.objects.filter(gear=gear)
        return GearImage.objects.all()  