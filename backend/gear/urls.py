from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, GearKitViewSet, GearReviewViewSet, GearImageViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'', GearKitViewSet, basename='gear')

urlpatterns = [
    path('', include(router.urls)),
    path('<slug:gear_slug>/reviews/', GearReviewViewSet.as_view({'get': 'list', 'post': 'create'}), name='gear-reviews'),
    path('<slug:gear_slug>/reviews/<int:pk>/', GearReviewViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='gear-review-detail'),
    path('<slug:gear_slug>/images/', GearImageViewSet.as_view({'get': 'list', 'post': 'create'}), name='gear-images'),
    path('<slug:gear_slug>/images/<int:pk>/', GearImageViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='gear-image-detail'),
]
