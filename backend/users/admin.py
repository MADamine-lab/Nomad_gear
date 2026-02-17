from django.contrib import admin
from .models import CustomUser, UserReview, UserNotification


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_verified', 'created_at')
    list_filter = ('is_verified', 'is_active_renter', 'created_at')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Personal Info', {'fields': ('username', 'email', 'first_name', 'last_name', 'phone', 'avatar', 'bio')}),
        ('Address', {'fields': ('address', 'city', 'postal_code', 'country')}),
        ('Payment', {'fields': ('preferred_payment_method',)}),
        ('Status', {'fields': ('is_verified', 'is_active_renter', 'is_active')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(UserReview)
class UserReviewAdmin(admin.ModelAdmin):
    list_display = ('reviewer', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('reviewer__username', 'comment')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_notifications', 'sms_notifications', 'push_notifications')
    list_filter = ('email_notifications', 'sms_notifications', 'push_notifications')
    search_fields = ('user__username', 'user__email')
