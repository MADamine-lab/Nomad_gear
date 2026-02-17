from rest_framework import serializers
from datetime import datetime, timedelta
from django.conf import settings
from .models import Category, GearKit, GearReview, GearImage, GearAvailability


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'image', 'is_active']


class GearImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GearImage
        fields = ['id', 'image', 'alt_text', 'display_order']


class GearReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    
    class Meta:
        model = GearReview
        fields = [
            'id', 'gear', 'user', 'user_name', 'user_avatar', 'rating',
            'title', 'comment', 'helpful_count', 'is_verified_purchase', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'user_name', 'user_avatar', 'helpful_count', 'created_at']


class GearListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    best_price = serializers.SerializerMethodField()
    main_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = GearKit
        fields = [
            'id', 'name', 'slug', 'description', 'category', 'daily_price',
            'currency', 'main_image', 'main_image_url', 'quantity_available', 
            'rating', 'review_count', 'best_price', 'is_featured', 'created_at'
        ]
    
    def get_best_price(self, obj):
        return float(obj.get_best_price())
    
    def get_main_image_url(self, obj):
        if obj.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return f"{settings.MEDIA_URL}{obj.main_image}"
        return None


class GearDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    reviews = GearReviewSerializer(many=True, read_only=True)
    additional_images = GearImageSerializer(many=True, read_only=True)
    main_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = GearKit
        fields = [
            'id', 'name', 'slug', 'description', 'long_description', 'category',
            'daily_price', 'weekly_price', 'monthly_price', 'currency',
            'main_image', 'main_image_url', 'additional_images', 'weight', 
            'dimensions', 'material', 'color', 'brand', 'features', 
            'quantity_available', 'max_rental_days', 'min_rental_days', 
            'status', 'rating', 'review_count', 'reviews',
            'is_featured', 'view_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'view_count', 'created_at', 'updated_at', 'reviews', 'rating', 'review_count']
    
    def get_main_image_url(self, obj):
        if obj.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return f"{settings.MEDIA_URL}{obj.main_image}"
        return None


class GearCreateUpdateSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(write_only=True)
    additional_images = GearImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = GearKit
        fields = [
            'id', 'name', 'description', 'long_description', 'category_id',
            'daily_price', 'weekly_price', 'monthly_price', 'currency',
            'main_image', 'additional_images', 'weight', 'dimensions', 'material',
            'color', 'brand', 'features', 'quantity_available', 'max_rental_days',
            'min_rental_days', 'status', 'is_featured', 'meta_title', 'meta_description'
        ]
    
    def create(self, validated_data):
        category_id = validated_data.pop('category_id')
        try:
            category = Category.objects.get(id=category_id)
            validated_data['category'] = category
        except Category.DoesNotExist:
            raise serializers.ValidationError({'category': 'Invalid category'})
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                validated_data['category'] = category
            except Category.DoesNotExist:
                raise serializers.ValidationError({'category': 'Invalid category'})
        return super().update(instance, validated_data)


class GearAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = GearAvailability
        fields = ['id', 'gear', 'date', 'available_quantity', 'created_at', 'updated_at']


class GearPricingSerializer(serializers.Serializer):
    gear_id = serializers.IntegerField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    quantity = serializers.IntegerField(min_value=1)
    
    def validate(self, data):
        if data['end_date'] <= data['start_date']:
            raise serializers.ValidationError('End date must be after start date')
        try:
            gear = GearKit.objects.get(id=data['gear_id'])
            if gear.quantity_available < data['quantity']:
                raise serializers.ValidationError('Not enough quantity available')
        except GearKit.DoesNotExist:
            raise serializers.ValidationError('Gear not found')
        return data