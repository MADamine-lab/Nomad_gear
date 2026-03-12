from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, PaymentViewSet, GearConditionReportViewSet,StripeWebhookView,test_orders

router = DefaultRouter()
router.register(r'', OrderViewSet, basename='order')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'condition-reports', GearConditionReportViewSet, basename='condition-report')

urlpatterns = [
    path('test/', test_orders, name='test-orders'),
    path('', include(router.urls)),
    path('webhooks/stripe/', StripeWebhookView.as_view(), name='stripe-webhook'),
]

