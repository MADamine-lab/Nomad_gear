from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import datetime, timedelta
from decimal import Decimal
import stripe
import requests
import json
from django.conf import settings

from .models import Order, Payment, OrderTimeline, GearConditionReport
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer,
    OrderUpdateSerializer, OrderStatusUpdateSerializer, PaymentSerializer,
    OrderTimelineSerializer, GearConditionReportSerializer
)
from gear.models import GearAvailability


@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def test_orders(request):
    return Response({
        'method': request.method,
        'message': 'API is working!',
        'user': str(request.user)
    })


class OrderPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class OrderViewSet(viewsets.ModelViewSet):
    """
    Order management viewset
    GET /api/v1/orders/ - List user's orders
    POST /api/v1/orders/ - Create new order
    GET /api/v1/orders/{id}/ - Get order details
    """
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = OrderPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status']
    ordering_fields = ['created_at', 'start_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        # Users can only see their own orders, except admins
        if user.is_staff:
            return Order.objects.select_related('user', 'gear').prefetch_related('payments', 'timeline')
        return Order.objects.filter(user=user).select_related('gear').prefetch_related('payments', 'timeline')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderDetailSerializer
        elif self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        elif self.action == 'update_status':
            return OrderStatusUpdateSerializer
        return OrderListSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create new order with automatic pricing calculation
        """
        print("=" * 50)
        print("CREATE METHOD CALLED!")
        print(f"Request method: {request.method}")
        print(f"Request path: {request.path}")
        print(f"Request data: {request.data}")
        print(f"User: {request.user}")
        print("=" * 50)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        gear = data['gear']
        start_date = data['start_date']
        end_date = data['end_date']
        quantity = data['quantity']
        
        # Calculate rental duration
        num_days = (end_date - start_date).days
        
        # Calculate best pricing
        daily_cost = gear.daily_price * quantity * num_days
        weekly_cost = (gear.weekly_price * quantity * (num_days // 7)) + (gear.daily_price * quantity * (num_days % 7))
        monthly_cost = (gear.monthly_price * quantity * (num_days // 30)) + (gear.daily_price * quantity * (num_days % 30))
        
        best_price = min(daily_cost, weekly_cost, monthly_cost)
        tax_amount = best_price * Decimal('0.1')
        insurance_amount = data.get('insurance_selected', False) and (best_price * Decimal('0.05')) or 0  # 5% insurance
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            gear=gear,
            start_date=start_date,
            end_date=end_date,
            quantity=quantity,
            unit_price=gear.daily_price,
            total_price=best_price,
            tax_amount=tax_amount,
            insurance_selected=data.get('insurance_selected', False),
            insurance_amount=insurance_amount,
            final_price=best_price + tax_amount + insurance_amount,
            currency=gear.currency,
            delivery_address=data.get('delivery_address', ''),
            delivery_city=data.get('delivery_city', ''),
            delivery_postal_code=data.get('delivery_postal_code', ''),
            delivery_country=data.get('delivery_country', ''),
            special_requests=data.get('special_requests', ''),
        )
        
        # Create timeline entry
        OrderTimeline.objects.create(
            order=order,
            event_type='created',
            description='Order created by customer',
            created_by=request.user
        )

        print(f"Order created successfully: {order.order_number}")

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Get current user's orders"""
        orders = self.get_queryset()
        page = self.paginate_queryset(orders)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an order"""
        order = self.get_object()
        
        if not order.can_be_modified():
            return Response(
                {'detail': 'This order cannot be cancelled in its current status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.save()
        
        OrderTimeline.objects.create(
            order=order,
            event_type='cancelled',
            description=request.data.get('reason', 'Order cancelled by user'),
            created_by=request.user
        )
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm pending order"""
        order = self.get_object()
        
        if order.status != 'pending':
            return Response(
                {'detail': 'Only pending orders can be confirmed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'confirmed'
        order.confirmed_at = timezone.now()
        order.save()
        
        OrderTimeline.objects.create(
            order=order,
            event_type='confirmed',
            description='Order confirmed',
            created_by=request.user
        )
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def start_rental(self, request, pk=None):
        """Start rental (mark as in_progress)"""
        order = self.get_object()
        
        if order.status not in ['pending', 'confirmed']:
            return Response(
                {'detail': 'This order cannot be started'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'in_progress'
        order.pickup_date = request.data.get('pickup_date', timezone.now().date())
        order.save()
        
        OrderTimeline.objects.create(
            order=order,
            event_type='picked_up',
            description='Rental started - gear picked up',
            created_by=request.user
        )
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def complete_rental(self, request, pk=None):
        """Complete rental and return gear"""
        order = self.get_object()
        
        if order.status != 'in_progress':
            return Response(
                {'detail': 'Only active rentals can be completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'completed'
        order.return_date = request.data.get('return_date', timezone.now().date())
        order.completed_at = timezone.now()
        order.save()
        
        OrderTimeline.objects.create(
            order=order,
            event_type='returned',
            description='Gear returned - rental completed',
            created_by=request.user
        )
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def report_damage(self, request, pk=None):
        """Report damage to rented gear"""
        order = self.get_object()
        
        order.damage_reported = True
        order.damage_description = request.data.get('description', '')
        order.damage_cost = request.data.get('damage_cost', 0)
        order.save()
        
        OrderTimeline.objects.create(
            order=order,
            event_type='issue_reported',
            description=f"Damage reported: {order.damage_description}",
            created_by=request.user
        )
        
        return Response(
            {'detail': 'Damage reported successfully', 'order': OrderDetailSerializer(order).data}
        )
    
    @action(detail=False, methods=['get'])
    def active_rentals(self, request):
        """Get all active rentals for current user"""
        orders = self.get_queryset().filter(status='in_progress')
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue_rentals(self, request):
        """Get overdue rentals"""
        today = timezone.now().date()
        orders = self.get_queryset().filter(
            status='in_progress',
            end_date__lt=today
        )
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get order statistics for current user"""
        orders = self.get_queryset()
        
        return Response({
            'total_orders': orders.count(),
            'total_spending': sum(o.final_price for o in orders),
            'completed_orders': orders.filter(status='completed').count(),
            'active_rentals': orders.filter(status='in_progress').count(),
            'cancelled_orders': orders.filter(status='cancelled').count(),
            'average_order_value': orders.aggregate(Sum('final_price'))['final_price__sum'] / orders.count() if orders.count() > 0 else 0,
        })


class PaymentViewSet(viewsets.ModelViewSet):
    """
    Payment management viewset with Stripe, Flouci, and Cash on Delivery support
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(order__user=user)
    
    @action(detail=False, methods=['post'])
    def create_stripe_payment(self, request):
        """Create Stripe PaymentIntent"""
        order_id = request.data.get('order_id')
        
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already paid
        if order.payment_status == 'paid':
            return Response(
                {'detail': 'Order already paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Initialize Stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            
            # Create PaymentIntent
            intent = stripe.PaymentIntent.create(
                amount=int(order.final_price * 100),  # Convert to cents
                currency=order.currency.lower(),
                metadata={
                    'order_id': order.id,
                    'order_number': order.order_number,
                    'user_id': request.user.id,
                },
                automatic_payment_methods={'enabled': True},
            )
            
            # Create payment record
            payment = Payment.objects.create(
                order=order,
                payment_method='stripe',
                amount=order.final_price,
                currency=order.currency,
                status='pending',
                payment_intent_id=intent.id,
                provider_response={'client_secret': intent.client_secret}
            )
            
            return Response({
                'client_secret': intent.client_secret,
                'payment_id': payment.id,
                'amount': order.final_price,
                'currency': order.currency,
            })
            
        except stripe.error.StripeError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def confirm_stripe_payment(self, request):
        """Confirm Stripe payment after frontend completion"""
        payment_intent_id = request.data.get('payment_intent_id')
        
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            payment = Payment.objects.get(payment_intent_id=payment_intent_id)
            
            if intent.status == 'succeeded':
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.provider_response = intent
                payment.save()
                
                # Update order status
                payment.order.payment_status = 'paid'
                payment.order.save()
                
                # Create timeline entry
                OrderTimeline.objects.create(
                    order=payment.order,
                    event_type='payment_received',
                    description=f'Payment completed via Stripe - {payment.amount} {payment.currency}',
                    created_by=request.user
                )
                
                return Response({
                    'status': 'success',
                    'message': 'Payment confirmed',
                    'order': OrderDetailSerializer(payment.order).data
                })
            else:
                payment.status = 'failed'
                payment.save()
                return Response(
                    {'detail': f'Payment failed: {intent.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Payment.DoesNotExist:
            return Response(
                {'detail': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.error.StripeError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def create_flouci_payment(self, request):
        """Create Flouci payment (Tunisian gateway)"""
        order_id = request.data.get('order_id')
        
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            # Flouci API endpoint
            flouci_url = "https://api.flouci.com/api/generate_payment"
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {settings.FLOUCI_APP_TOKEN}'
            }
            
            payload = {
                'app_token': settings.FLOUCI_APP_TOKEN,
                'app_secret': settings.FLOUCI_APP_SECRET,
                'amount': str(int(order.final_price * 1000)),  # Flouci uses millimes
                'accept_card': settings.FLOUCI_ACCEPT_CARD,
                'session_timeout_secs': 1200,
                'success_link': f'{settings.FRONTEND_URL}/payment/success?order={order.id}',
                'fail_link': f'{settings.FRONTEND_URL}/payment/failed?order={order.id}',
                'developer_tracking_id': str(order.id),
            }
            
            response = requests.post(flouci_url, json=payload, headers=headers)
            data = response.json()
            
            if response.status_code == 200 and 'payment_id' in data:
                # Create payment record
                payment = Payment.objects.create(
                    order=order,
                    payment_method='flouci',
                    amount=order.final_price,
                    currency=order.currency,
                    status='pending',
                    payment_intent_id=data['payment_id'],
                    provider_response=data
                )
                
                return Response({
                    'payment_id': data['payment_id'],
                    'payment_url': data.get('payment_url'),
                    'amount': order.final_price,
                    'currency': order.currency,
                })
            else:
                return Response(
                    {'detail': data.get('message', 'Flouci payment creation failed')},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except requests.RequestException as e:
            return Response(
                {'detail': f'Payment gateway error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def confirm_flouci_payment(self, request):
        """Verify Flouci payment status"""
        payment_id = request.data.get('payment_id')
        
        try:
            payment = Payment.objects.get(payment_intent_id=payment_id)
            
            # Verify with Flouci API
            verify_url = f"https://api.flouci.com/api/verify_payment/{payment_id}"
            headers = {
                'Authorization': f'Bearer {settings.FLOUCI_APP_TOKEN}'
            }
            
            response = requests.get(verify_url, headers=headers)
            data = response.json()
            
            if data.get('status') == 'completed':
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.provider_response = data
                payment.save()
                
                # Update order
                payment.order.payment_status = 'paid'
                payment.order.save()
                
                # Create timeline
                OrderTimeline.objects.create(
                    order=payment.order,
                    event_type='payment_received',
                    description=f'Payment completed via Flouci - {payment.amount} {payment.currency}',
                    created_by=request.user
                )
                
                return Response({
                    'status': 'success',
                    'message': 'Payment confirmed',
                    'order': OrderDetailSerializer(payment.order).data
                })
            else:
                return Response({
                    'status': 'pending',
                    'message': 'Payment still processing'
                })
                
        except Payment.DoesNotExist:
            return Response(
                {'detail': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def create_cod_order(self, request):
        """Create Cash on Delivery order"""
        order_id = request.data.get('order_id')
        
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not settings.COD_ENABLED:
            return Response(
                {'detail': 'Cash on Delivery is not available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate COD fee
        cod_fee = Decimal(str(settings.COD_EXTRA_FEE))
        total_with_cod = order.final_price + cod_fee
        
        # Create payment record
        payment = Payment.objects.create(
            order=order,
            payment_method='cash',
            amount=total_with_cod,
            currency=order.currency,
            status='pending',  # Will be completed when delivered
            notes=f'Cash on Delivery - Extra fee: {cod_fee} {order.currency}'
        )
        
        # Update order with COD fee
        order.final_price = total_with_cod
        order.payment_status = 'partial'  # Will be paid on delivery
        order.save()
        
        # Create timeline
        OrderTimeline.objects.create(
            order=order,
            event_type='payment_received',
            description=f'Cash on Delivery order created - Total: {total_with_cod} {order.currency} (includes {cod_fee} COD fee)',
            created_by=request.user
        )
        
        return Response({
            'status': 'success',
            'message': 'Cash on Delivery order confirmed',
            'payment_method': 'cash',
            'amount_due': total_with_cod,
            'cod_fee': cod_fee,
            'order': OrderDetailSerializer(order).data
        })
    
    @action(detail=False, methods=['post'])
    def process_payment(self, request):
        """Legacy payment processing - redirects to appropriate method"""
        payment_method = request.data.get('payment_method')
        
        if payment_method == 'stripe':
            return self.create_stripe_payment(request)
        elif payment_method == 'flouci':
            return self.create_flouci_payment(request)
        elif payment_method == 'cash':
            return self.create_cod_order(request)
        else:
            return Response(
                {'detail': 'Invalid payment method'},
                status=status.HTTP_400_BAD_REQUEST
            )


# Add webhook handler for Stripe
@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    Handle Stripe webhooks
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        
        # Handle successful payment
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            try:
                payment = Payment.objects.get(payment_intent_id=payment_intent['id'])
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.provider_response = payment_intent
                payment.save()
                
                payment.order.payment_status = 'paid'
                payment.order.save()
                
            except Payment.DoesNotExist:
                pass
        
        return Response({'status': 'success'})

class GearConditionReportViewSet(viewsets.ModelViewSet):
    """
    Gear condition report viewset
    """
    serializer_class = GearConditionReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return GearConditionReport.objects.all()
        return GearConditionReport.objects.filter(order__user=user)