from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, PaymentViewSet, GearConditionReportViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'condition-reports', GearConditionReportViewSet, basename='condition-report')

urlpatterns = [
    path('', include(router.urls)),
]
