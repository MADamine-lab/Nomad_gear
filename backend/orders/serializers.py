from rest_framework import serializers
from .models import Order, Payment, OrderTimeline, GearConditionReport


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for payment records
    """
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'payment_method', 'amount', 'currency', 'status',
            'transaction_id', 'reference_number', 'notes', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


class OrderTimelineSerializer(serializers.ModelSerializer):
    """
    Serializer for order timeline events
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = OrderTimeline
        fields = ['id', 'event_type', 'description', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class GearConditionReportSerializer(serializers.ModelSerializer):
    """
    Serializer for gear condition reports
    """
    inspected_by_name = serializers.CharField(source='inspected_by.get_full_name', read_only=True)
    
    class Meta:
        model = GearConditionReport
        fields = [
            'id', 'order', 'pre_rental_condition', 'pre_rental_notes', 'pre_rental_images',
            'post_rental_condition', 'post_rental_notes', 'post_rental_images',
            'damage_found', 'damage_description', 'damage_cost', 'inspected_by',
            'inspected_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OrderListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing orders
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    gear_name = serializers.CharField(source='gear.name', read_only=True)
    gear_image = serializers.ImageField(source='gear.main_image', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'user_name', 'gear', 'gear_name', 'gear_image',
            'start_date', 'end_date', 'quantity', 'final_price', 'currency', 'status',
            'payment_status', 'created_at'
        ]
        read_only_fields = ['id', 'order_number', 'user_name', 'gear_name', 'created_at']


class OrderDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for single order
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    gear_name = serializers.CharField(source='gear.name', read_only=True)
    gear_image = serializers.ImageField(source='gear.main_image', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    timeline = OrderTimelineSerializer(many=True, read_only=True)
    condition_report = GearConditionReportSerializer(read_only=True)
    rental_duration_days = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'user_name', 'user_email', 'gear', 'gear_name',
            'gear_image', 'start_date', 'end_date', 'rental_duration_days', 'quantity',
            'unit_price', 'total_price', 'discount_amount', 'tax_amount', 'final_price',
            'currency', 'status', 'payment_status', 'pickup_date', 'return_date',
            'delivery_address', 'delivery_city', 'delivery_postal_code', 'delivery_country',
            'special_requests', 'notes', 'insurance_selected', 'insurance_amount',
            'damage_reported', 'damage_description', 'damage_cost', 'payments', 'timeline',
            'condition_report', 'created_at', 'updated_at', 'confirmed_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'user_name', 'user_email', 'gear_name', 'gear_image',
            'unit_price', 'total_price', 'final_price', 'payments', 'timeline',
            'condition_report', 'created_at', 'updated_at', 'confirmed_at', 'completed_at'
        ]
    
    def get_rental_duration_days(self, obj):
        return obj.rental_duration_days


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new orders
    """
    class Meta:
        model = Order
        fields = [
            'gear', 'start_date', 'end_date', 'quantity', 'delivery_address',
            'delivery_city', 'delivery_postal_code', 'delivery_country',
            'special_requests', 'insurance_selected'
        ]
    
    def validate(self, data):
        if data['end_date'] <= data['start_date']:
            raise serializers.ValidationError('End date must be after start date')
        
        # Check gear availability
        gear = data['gear']
        if not gear.is_available():
            raise serializers.ValidationError({'gear': 'Gear is not available for rental'})
        
        if gear.quantity_available < data['quantity']:
            raise serializers.ValidationError({'quantity': 'Not enough quantity available'})
        
        return data


class OrderUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating orders (only specific fields)
    """
    class Meta:
        model = Order
        fields = [
            'status', 'payment_status', 'special_requests', 'notes',
            'insurance_selected', 'damage_reported', 'damage_description'
        ]


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for status updates with timeline
    """
    status_reason = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = Order
        fields = ['status', 'status_reason', 'notes']
    
    def update(self, instance, validated_data):
        status_reason = validated_data.pop('status_reason')
        old_status = instance.status
        
        instance = super().update(instance, validated_data)
        
        # Create timeline entry
        if instance.status != old_status:
            OrderTimeline.objects.create(
                order=instance,
                event_type=instance.status.upper(),
                description=status_reason,
                created_by=self.context['request'].user
            )
        
        return instance
