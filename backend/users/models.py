from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import URLValidator


class CustomUser(AbstractUser):
    """
    Custom User model with additional fields specific to Nomad Gear
    """
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    
    # Address Fields
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    # Payment Information
    preferred_payment_method = models.CharField(
        max_length=50,
        choices=[
            ('card', 'Credit/Debit Card'),
            ('paypal', 'PayPal'),
            ('bank_transfer', 'Bank Transfer'),
        ],
        blank=True
    )
    
    # User Status
    is_verified = models.BooleanField(default=False)
    is_active_renter = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_address(self):
        """Return formatted full address"""
        parts = [self.address, self.city, self.postal_code, self.country]
        return ', '.join(filter(None, parts))


class UserReview(models.Model):
    """
    User reviews for rented gear
    """
    RATING_CHOICES = [
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    ]
    
    reviewer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reviews_given')
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Review by {self.reviewer.get_full_name()} - {self.rating}★"


class UserNotification(models.Model):
    """
    Notification preferences and history
    """
    NOTIFICATION_TYPES = [
        ('booking', 'Booking Updates'),
        ('promotion', 'Promotions'),
        ('review', 'Reviews'),
        ('payment', 'Payment Updates'),
        ('system', 'System Updates'),
    ]
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='notification_preferences')
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    notification_types = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_notifications'
    
    def __str__(self):
        return f"Notifications for {self.user.get_full_name()}"
