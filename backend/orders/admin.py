from django.contrib import admin
from .models import Order, Payment, OrderTimeline, GearConditionReport


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'gear', 'start_date', 'end_date', 'status', 'payment_status', 'final_price', 'created_at')
    list_filter = ('status', 'payment_status', 'created_at', 'start_date')
    search_fields = ('order_number', 'user__username', 'gear__name')
    readonly_fields = ('order_number', 'final_price', 'created_at', 'updated_at', 'confirmed_at', 'completed_at')
    
    fieldsets = (
        ('Order Info', {'fields': ('order_number', 'user', 'gear', 'status')}),
        ('Rental Dates', {'fields': ('start_date', 'end_date', 'pickup_date', 'return_date')}),
        ('Pricing', {'fields': ('quantity', 'unit_price', 'total_price', 'discount_amount', 'tax_amount', 'insurance_selected', 'insurance_amount', 'final_price', 'currency')}),
        ('Delivery', {'fields': ('delivery_address', 'delivery_city', 'delivery_postal_code', 'delivery_country')}),
        ('Payment', {'fields': ('payment_status',)}),
        ('Special Info', {'fields': ('special_requests', 'notes')}),
        ('Damage', {'fields': ('damage_reported', 'damage_description', 'damage_cost')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'confirmed_at', 'completed_at'), 'classes': ('collapse',)}),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'payment_method', 'amount', 'currency', 'status', 'created_at')
    list_filter = ('payment_method', 'status', 'created_at')
    search_fields = ('order__order_number', 'transaction_id', 'reference_number')
    readonly_fields = ('created_at', 'updated_at', 'completed_at')


@admin.register(OrderTimeline)
class OrderTimelineAdmin(admin.ModelAdmin):
    list_display = ('order', 'event_type', 'created_by', 'created_at')
    list_filter = ('event_type', 'created_at')
    search_fields = ('order__order_number', 'description')
    readonly_fields = ('created_at',)


@admin.register(GearConditionReport)
class GearConditionReportAdmin(admin.ModelAdmin):
    list_display = ('order', 'pre_rental_condition', 'post_rental_condition', 'damage_found', 'created_at')
    list_filter = ('damage_found', 'pre_rental_condition', 'post_rental_condition', 'created_at')
    search_fields = ('order__order_number',)
    readonly_fields = ('created_at', 'updated_at')
