from django.db import models
from django.core.validators import MinValueValidator
from django.db.models import Q
from datetime import datetime


class Order(models.Model):
    """
    Rental orders/bookings
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('returned', 'Returned'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('partial', 'Partially Paid'),
        ('paid', 'Paid'),
        ('refunded', 'Refunded'),
    ]
    
    # Order Identification
    order_number = models.CharField(max_length=50, unique=True)
    
    # Customer & Rental Info
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='orders')
    gear = models.ForeignKey('gear.GearKit', on_delete=models.CASCADE, related_name='orders')
    
    # Rental Dates
    start_date = models.DateField()
    end_date = models.DateField()
    pickup_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)
    
    # Quantity and Pricing
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    final_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='TND')
    
    # Status Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')
    
    # Delivery Information
    delivery_address = models.TextField()
    delivery_city = models.CharField(max_length=100)
    delivery_postal_code = models.CharField(max_length=20)
    delivery_country = models.CharField(max_length=100)
    
    # Special Requests
    special_requests = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Insurance & Damage
    insurance_selected = models.BooleanField(default=False)
    insurance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    damage_reported = models.BooleanField(default=False)
    damage_description = models.TextField(blank=True)
    damage_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['start_date']),
        ]
    
    def __str__(self):
        return f"Order {self.order_number} - {self.gear.name}"
    
    def save(self, *args, **kwargs):
        # Auto-generate order number
        if not self.order_number:
            import uuid
            self.order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4()).split('-')[0].upper()}"
        
        # Calculate final price
        self.final_price = self.total_price - self.discount_amount + self.tax_amount + self.insurance_amount
        
        super().save(*args, **kwargs)
    
    def is_active(self):
        """Check if order is currently active"""
        return self.status in ['pending', 'confirmed', 'in_progress']
    
    def can_be_modified(self):
        """Check if order can still be modified"""
        return self.status in ['pending', 'confirmed']
    
    @property
    def rental_duration_days(self):
        """Calculate rental duration in days"""
        return (self.end_date - self.start_date).days
    
    @property
    def is_overdue(self):
        """Check if gear is overdue for return"""
        if self.status == 'in_progress' and self.end_date < datetime.now().date():
            return True
        return False


class Payment(models.Model):
    """
    Payment records for orders
    """
    PAYMENT_METHOD_CHOICES = [
        ('card', 'Credit/Debit Card'),
        ('paypal', 'PayPal'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    
    # Payment Details
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='TND')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Reference Information
    transaction_id = models.CharField(max_length=100, blank=True, unique=True)
    reference_number = models.CharField(max_length=100, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['status']),
            models.Index(fields=['transaction_id']),
        ]
    
    def __str__(self):
        return f"Payment for {self.order.order_number} - {self.amount} {self.currency}"


class OrderTimeline(models.Model):
    """
    Track order status changes and events
    """
    EVENT_TYPES = [
        ('created', 'Order Created'),
        ('confirmed', 'Order Confirmed'),
        ('payment_received', 'Payment Received'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('picked_up', 'Picked Up'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('issue_reported', 'Issue Reported'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='timeline')
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    description = models.TextField()
    created_by = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'order_timeline'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.order.order_number} - {self.event_type}"


class GearConditionReport(models.Model):
    """
    Condition reports for gear before and after rental
    """
    CONDITION_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('damaged', 'Damaged'),
    ]
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='condition_report')
    
    # Pre-rental condition
    pre_rental_condition = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    pre_rental_notes = models.TextField(blank=True)
    pre_rental_images = models.JSONField(default=list, blank=True)
    
    # Post-rental condition
    post_rental_condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, null=True, blank=True)
    post_rental_notes = models.TextField(blank=True)
    post_rental_images = models.JSONField(default=list, blank=True)
    
    # Damage Assessment
    damage_found = models.BooleanField(default=False)
    damage_description = models.TextField(blank=True)
    damage_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Inspection
    inspected_by = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='condition_inspections')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'gear_condition_report'
    
    def __str__(self):
        return f"Condition Report for {self.order.order_number}"
