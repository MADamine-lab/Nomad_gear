from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from .models import Order, Payment, OrderTimeline, GearConditionReport
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer,
    OrderUpdateSerializer, OrderStatusUpdateSerializer, PaymentSerializer,
    OrderTimelineSerializer, GearConditionReportSerializer
)
from gear.models import GearAvailability


class OrderPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class OrderViewSet(viewsets.ModelViewSet):
    """
    Order management viewset
    GET /api/v1/orders/ - List user's orders
    POST /api/v1/orders/ - Create new order
    GET /api/v1/orders/{id}/ - Get order details
    """
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = OrderPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status']
    ordering_fields = ['created_at', 'start_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        # Users can only see their own orders, except admins
        if user.is_staff:
            return Order.objects.select_related('user', 'gear').prefetch_related('payments', 'timeline')
        return Order.objects.filter(user=user).select_related('gear').prefetch_related('payments', 'timeline')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderDetailSerializer
        elif self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        elif self.action == 'update_status':
            return OrderStatusUpdateSerializer
        return OrderListSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create new order with automatic pricing calculation
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        gear = data['gear']
        start_date = data['start_date']
        end_date = data['end_date']
        quantity = data['quantity']
        
        # Calculate rental duration
        num_days = (end_date - start_date).days
        
        # Calculate best pricing
        daily_cost = gear.daily_price * quantity * num_days
        weekly_cost = (gear.weekly_price * quantity * (num_days // 7)) + (gear.daily_price * quantity * (num_days % 7))
        monthly_cost = (gear.monthly_price * quantity * (num_days // 30)) + (gear.daily_price * quantity * (num_days % 30))
        
        best_price = min(daily_cost, weekly_cost, monthly_cost)
        tax_amount = best_price * Decimal('0.1')
        insurance_amount = data.get('insurance_selected', False) and (best_price * Decimal('0.05')) or 0  # 5% insurance
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            gear=gear,
            start_date=start_date,
            end_date=end_date,
            quantity=quantity,
            unit_price=gear.daily_price,
            total_price=best_price,
            tax_amount=tax_amount,
            insurance_selected=data.get('insurance_selected', False),
            insurance_amount=insurance_amount,
            final_price=best_price + tax_amount + insurance_amount,
            currency=gear.currency,
            delivery_address=data.get('delivery_address', ''),
            delivery_city=data.get('delivery_city', ''),
            delivery_postal_code=data.get('delivery_postal_code', ''),
            delivery_country=data.get('delivery_country', ''),
            special_requests=data.get('special_requests', ''),
        )
        
        # Create timeline entry
        OrderTimeline.objects.create(
            order=order,
            event_type='created',
            description='Order created by customer',
            created_by=request.user
        )
        
        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Get current user's orders"""
        orders = self.get_queryset()
        page = self.paginate_queryset(orders)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an order"""
        order = self.get_object()
        
        if not order.can_be_modified():
            return Response(
                {'detail': 'This order cannot be cancelled in its current status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.save()
        
        OrderTimeline.objects.create(
            order=order,
            event_type='cancelled',
            description=request.data.get('reason', 'Order cancelled by user'),
            created_by=request.user
        )
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm pending order"""
        order = self.get_object()
        
        if order.status != 'pending':
            return Response(
                {'detail': 'Only pending orders can be confirmed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'confirmed'
        order.confirmed_at = timezone.now()
        order.save()
        
        OrderTimeline.objects.create(
            order=order,
            event_type='confirmed',
            description='Order confirmed',
            created_by=request.user
        )
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def start_rental(self, request, pk=None):
        """Start rental (mark as in_progress)"""
        order = self.get_object()
        
        if order.status not in ['pending', 'confirmed']:
            return Response(
                {'detail': 'This order cannot be started'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'in_progress'
        order.pickup_date = request.data.get('pickup_date', timezone.now().date())
        order.save()
        
        OrderTimeline.objects.create(
            order=order,
            event_type='picked_up',
            description='Rental started - gear picked up',
            created_by=request.user
        )
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def complete_rental(self, request, pk=None):
        """Complete rental and return gear"""
        order = self.get_object()
        
        if order.status != 'in_progress':
            return Response(
                {'detail': 'Only active rentals can be completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'completed'
        order.return_date = request.data.get('return_date', timezone.now().date())
        order.completed_at = timezone.now()
        order.save()
        
        OrderTimeline.objects.create(
            order=order,
            event_type='returned',
            description='Gear returned - rental completed',
            created_by=request.user
        )
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def report_damage(self, request, pk=None):
        """Report damage to rented gear"""
        order = self.get_object()
        
        order.damage_reported = True
        order.damage_description = request.data.get('description', '')
        order.damage_cost = request.data.get('damage_cost', 0)
        order.save()
        
        OrderTimeline.objects.create(
            order=order,
            event_type='issue_reported',
            description=f"Damage reported: {order.damage_description}",
            created_by=request.user
        )
        
        return Response(
            {'detail': 'Damage reported successfully', 'order': OrderDetailSerializer(order).data}
        )
    
    @action(detail=False, methods=['get'])
    def active_rentals(self, request):
        """Get all active rentals for current user"""
        orders = self.get_queryset().filter(status='in_progress')
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue_rentals(self, request):
        """Get overdue rentals"""
        today = timezone.now().date()
        orders = self.get_queryset().filter(
            status='in_progress',
            end_date__lt=today
        )
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get order statistics for current user"""
        orders = self.get_queryset()
        
        return Response({
            'total_orders': orders.count(),
            'total_spending': sum(o.final_price for o in orders),
            'completed_orders': orders.filter(status='completed').count(),
            'active_rentals': orders.filter(status='in_progress').count(),
            'cancelled_orders': orders.filter(status='cancelled').count(),
            'average_order_value': orders.aggregate(Sum('final_price'))['final_price__sum'] / orders.count() if orders.count() > 0 else 0,
        })


class PaymentViewSet(viewsets.ModelViewSet):
    """
    Payment management viewset
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(order__user=user)
    
    @action(detail=False, methods=['post'])
    def process_payment(self, request):
        """Process payment for an order"""
        order_id = request.data.get('order_id')
        payment_method = request.data.get('payment_method')
        amount = request.data.get('amount')
        
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create payment
        payment = Payment.objects.create(
            order=order,
            payment_method=payment_method,
            amount=amount,
            currency=order.currency,
            status='processing',
            transaction_id=f"TXN-{timezone.now().timestamp()}"
        )
        
        # In production, integrate with payment gateway here
        payment.status = 'completed'
        payment.completed_at = timezone.now()
        payment.save()
        
        # Update order payment status
        total_paid = order.payments.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0
        if total_paid >= order.final_price:
            order.payment_status = 'paid'
        elif total_paid > 0:
            order.payment_status = 'partial'
        order.save()
        
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class GearConditionReportViewSet(viewsets.ModelViewSet):
    """
    Gear condition report viewset
    """
    serializer_class = GearConditionReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return GearConditionReport.objects.all()
        return GearConditionReport.objects.filter(order__user=user)
