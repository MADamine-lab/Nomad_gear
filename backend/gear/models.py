from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify


class Category(models.Model):
    """
    Gear categories (Backpacking, Camping, Climbing, etc.)
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # For icon names
    image = models.ImageField(upload_to='categories/')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'categories'
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class GearKit(models.Model):
    """
    Gear kits available for rental
    """
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('rented', 'Rented'),
        ('maintenance', 'Maintenance'),
        ('retired', 'Retired'),
    ]
    
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    long_description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='gear_kits')
    
    # Pricing
    daily_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    weekly_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Currency (default TND - Tunisian Dinar)
    currency = models.CharField(max_length=3, default='TND')
    
    # Images
    main_image = models.ImageField(upload_to='gear/')
    images = models.JSONField(default=list, blank=True)  # Store multiple image URLs
    
    # Specifications
    weight = models.CharField(max_length=50, blank=True)  # e.g., "2.5 kg"
    dimensions = models.CharField(max_length=100, blank=True)  # e.g., "50x30x20 cm"
    material = models.CharField(max_length=100, blank=True)
    color = models.CharField(max_length=50, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    features = models.JSONField(default=list, blank=True)  # List of features
    
    # Availability
    quantity_available = models.IntegerField(validators=[MinValueValidator(0)])
    max_rental_days = models.IntegerField(default=30)
    min_rental_days = models.IntegerField(default=1)
    
    # Status and Ratings
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    review_count = models.IntegerField(default=0)
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=500, blank=True)
    
    # Activity tracking
    is_featured = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'gear_kits'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category']),
            models.Index(fields=['status']),
            models.Index(fields=['is_featured']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def get_best_price(self):
        """Calculate best price per day based on rental duration"""
        return min(self.daily_price, self.weekly_price / 7, self.monthly_price / 30)
    
    def is_available(self):
        """Check if gear is available for rental"""
        return self.status == 'available' and self.quantity_available > 0


class GearReview(models.Model):
    """
    Reviews for gear kits
    """
    RATING_CHOICES = [
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    ]
    
    gear = models.ForeignKey(GearKit, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='gear_reviews')
    rating = models.IntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=200)
    comment = models.TextField()
    
    helpful_count = models.IntegerField(default=0)
    is_verified_purchase = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'gear_reviews'
        ordering = ['-created_at']
        unique_together = ('gear', 'user')
        indexes = [
            models.Index(fields=['gear']),
            models.Index(fields=['rating']),
        ]
    
    def __str__(self):
        return f"Review of {self.gear.name} by {self.user.username}"


class GearImage(models.Model):
    """
    Additional images for gear kits
    """
    gear = models.ForeignKey(GearKit, on_delete=models.CASCADE, related_name='additional_images')
    image = models.ImageField(upload_to='gear/')
    alt_text = models.CharField(max_length=200, blank=True)
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'gear_images'
        ordering = ['display_order']
    
    def __str__(self):
        return f"Image for {self.gear.name}"


class GearAvailability(models.Model):
    """
    Track gear availability by date
    """
    gear = models.ForeignKey(GearKit, on_delete=models.CASCADE, related_name='availability')
    date = models.DateField()
    available_quantity = models.IntegerField(validators=[MinValueValidator(0)])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'gear_availability'
        unique_together = ('gear', 'date')
        ordering = ['date']
        indexes = [
            models.Index(fields=['gear', 'date']),
        ]
    
    def __str__(self):
        return f"{self.gear.name} - {self.date}: {self.available_quantity} available"
