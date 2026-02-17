from django.contrib import admin
from .models import Category, GearKit, GearReview, GearImage, GearAvailability


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(GearKit)
class GearKitAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'status', 'quantity_available', 'rating', 'is_featured', 'created_at')
    list_filter = ('category', 'status', 'is_featured', 'created_at')
    search_fields = ('name', 'brand')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('view_count', 'created_at', 'updated_at', 'rating', 'review_count')
    
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'slug', 'description', 'long_description', 'category')}),
        ('Pricing', {'fields': ('daily_price', 'weekly_price', 'monthly_price', 'currency')}),
        ('Images', {'fields': ('main_image', 'images')}),
        ('Specifications', {'fields': ('weight', 'dimensions', 'material', 'color', 'brand', 'features')}),
        ('Availability', {'fields': ('quantity_available', 'max_rental_days', 'min_rental_days')}),
        ('Status', {'fields': ('status', 'is_featured', 'rating', 'review_count')}),
        ('SEO', {'fields': ('meta_title', 'meta_description')}),
        ('Activity', {'fields': ('view_count', 'created_at', 'updated_at')}),
    )


@admin.register(GearReview)
class GearReviewAdmin(admin.ModelAdmin):
    list_display = ('gear', 'user', 'rating', 'is_verified_purchase', 'created_at')
    list_filter = ('rating', 'is_verified_purchase', 'created_at')
    search_fields = ('gear__name', 'user__username', 'title')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(GearImage)
class GearImageAdmin(admin.ModelAdmin):
    list_display = ('gear', 'display_order', 'created_at')
    list_filter = ('gear', 'created_at')
    search_fields = ('gear__name',)


@admin.register(GearAvailability)
class GearAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('gear', 'date', 'available_quantity')
    list_filter = ('gear', 'date')
    search_fields = ('gear__name',)
