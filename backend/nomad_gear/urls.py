"""
URL configuration for nomad_gear project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from .views import CookieTokenObtainPairView, CookieTokenRefreshView, logout_view

urlpatterns = [
    path('', RedirectView.as_view(url='/api/v1/docs/', permanent=False)),

    path('admin/', admin.site.urls),

    # API Authentication with cookie support
    path('api/auth/token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout/', logout_view, name='logout'),

    # API Documentation (keep v1 for docs consistency)
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API Endpoints - USE ONLY /api/ (not /api/v1/)
    path('api/users/', include('users.urls')),
    path('api/gear/', include('gear.urls')),
    path('api/orders/', include('orders.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
