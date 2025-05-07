# views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Shop, Order, OrderItem, Payment
from .serializers import ShopSerializer, OrderSerializer, OrderItemSerializer, PaymentSerializer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from packing_app.models import PackingInventory
from finished_product.models import FinishedProduct
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated

class ShopListCreateView(generics.ListCreateAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer

class ShopCreateView(generics.CreateAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer

class ShopDistrictAnalysisView(generics.ListAPIView):
    """
    API endpoint that returns shops with district information for analysis.
    """
    serializer_class = ShopSerializer

    def get_queryset(self):
        # Return all shops, but prioritize ones with district information
        return Shop.objects.all().order_by('-district', 'name')



class OrderListCreateView(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderApproveView(APIView):
    """
    Allows owners to approve submitted orders.
    """
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)

            if order.status != 'submitted':
                return Response({"error": "Only submitted orders can be approved."}, status=status.HTTP_400_BAD_REQUEST)

            order.status = 'approved'
            order.approval_date = timezone.now()
            order.save()

            return Response({
                "status": "approved",
                "order_id": order.id,
                "approval_date": order.approval_date
            }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

class OrderItemCreateView(generics.CreateAPIView):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer

    def perform_create(self, serializer):
        order_id = self.request.data.get('order')
        finished_product_id = self.request.data.get('finished_product')

        if not order_id or not finished_product_id:
            raise serializers.ValidationError({'error': 'Order and Finished Product IDs are required.'})

        order = get_object_or_404(Order, id=order_id)
        finished_product = get_object_or_404(FinishedProduct, id=finished_product_id)
        inventory = get_object_or_404(PackingInventory, finished_product=finished_product)

        # Get quantities from request
        six_packs = int(self.request.data.get('quantity_6_packs', 0))
        twelve_packs = int(self.request.data.get('quantity_12_packs', 0))
        extras = int(self.request.data.get('quantity_extra_items', 0))

        # Optional: Validate stock before deduction
        if (inventory.number_of_6_packs < six_packs or
            inventory.number_of_12_packs < twelve_packs or
            inventory.extra_items < extras):
            raise serializers.ValidationError({'error': 'Not enough inventory to fulfill the order.'})

        # Save order item and deduct inventory
        serializer.save(order=order, finished_product=finished_product)
        inventory.deduct_for_order(six_packs, twelve_packs, extras)




class OrderSubmitView(APIView):
    """
    Lets Order Coordinator mark an order as 'submitted' (finished preparing).
    """
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)

            if order.status != 'draft':
                return Response({"error": "Only draft orders can be submitted."}, status=status.HTTP_400_BAD_REQUEST)

            order.status = 'submitted'
            order.save()

            return Response({"status": "submitted", "order_id": order.id}, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)




class GenerateInvoiceView(APIView):
    """
    Allows owners to generate an invoice for an approved order.
    """
    def post(self, request, pk):
        try:
            order = Order.objects.prefetch_related('items__finished_product').get(pk=pk)

            if order.status != 'approved':
                return Response({"error": "Only approved orders can be invoiced."}, status=status.HTTP_400_BAD_REQUEST)

            # Generate invoice number (simple implementation - can be enhanced)
            current_date = timezone.now().strftime('%Y%m%d')
            invoice_number = f"INV-{current_date}-{order.id}"

            order.status = 'invoiced'
            order.invoice_number = invoice_number
            order.save()

            # Calculate total amount
            total_amount = order.total_amount

            # Get order items with calculated fields
            items = []
            for item in order.items.all():
                items.append({
                    'id': item.id,
                    'finished_product': item.finished_product.id,
                    'finished_product_name': item.finished_product.cutting_record.product_name if hasattr(item.finished_product, 'cutting_record') else f"Product #{item.finished_product.id}",
                    'quantity_6_packs': item.quantity_6_packs,
                    'quantity_12_packs': item.quantity_12_packs,
                    'quantity_extra_items': item.quantity_extra_items,
                    'total_units': item.total_units,
                    'subtotal': item.subtotal
                })

            return Response({
                "status": "invoiced",
                "order_id": order.id,
                "invoice_number": invoice_number,
                "total_amount": total_amount,
                "items": items,
                "shop_name": order.shop.name
            }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)


class MarkOrderDeliveredView(APIView):
    """
    Allows owners to mark an invoiced order as delivered.
    """
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)

            if order.status != 'invoiced':
                return Response({"error": "Only invoiced orders can be marked as delivered."}, status=status.HTTP_400_BAD_REQUEST)

            # Get delivery details from request
            delivery_notes = request.data.get('delivery_notes', '')
            delivered_items_count = request.data.get('delivered_items_count', 0)

            # Update order
            order.status = 'delivered'
            order.delivery_date = timezone.now()
            order.delivery_notes = delivery_notes
            order.delivered_items_count = delivered_items_count
            order.save()

            return Response({
                "status": "delivered",
                "order_id": order.id,
                "delivery_date": order.delivery_date,
                "message": "Order has been marked as delivered."
            }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)


class RecordPaymentView(APIView):
    """
    Allows owners to record payment for an order.
    """
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)

            if order.status not in ['invoiced', 'delivered', 'partially_paid', 'payment_due']:
                return Response({"error": "Only invoiced or delivered orders can have payments recorded."},
                               status=status.HTTP_400_BAD_REQUEST)

            # Get payment details from request
            payment_method = request.data.get('payment_method', '')
            # Convert to Decimal instead of float to avoid type mismatch with DecimalField
            from decimal import Decimal
            amount_paid = Decimal(str(request.data.get('amount_paid', 0)))
            payment_date = request.data.get('payment_date', timezone.now())
            notes = request.data.get('owner_notes', '')

            # Check payment details
            check_number = request.data.get('check_number', '')
            check_date = request.data.get('check_date', None)
            bank_name = request.data.get('bank_name', '')

            # Credit payment details
            credit_term_months = int(request.data.get('credit_term_months', 0))
            payment_due_date = None

            # Calculate payment due date for credit payments
            if payment_method == 'credit' and credit_term_months > 0:
                from datetime import datetime, timedelta
                if isinstance(payment_date, str):
                    payment_date = datetime.strptime(payment_date, '%Y-%m-%d')
                payment_due_date = payment_date + timedelta(days=30 * credit_term_months)

            # Create a new Payment record
            payment = Payment.objects.create(
                order=order,
                amount=amount_paid,
                payment_method=payment_method,
                payment_date=payment_date,
                notes=notes,
                check_number=check_number if payment_method == 'check' else '',
                check_date=check_date if payment_method == 'check' else None,
                bank_name=bank_name if payment_method == 'check' else '',
                credit_term_months=credit_term_months if payment_method == 'credit' else 0,
                payment_due_date=payment_due_date
            )

            # Update owner notes
            if notes:
                order.owner_notes = notes

            # Calculate total paid amount from all payments
            total_paid = order.total_paid
            total_amount = order.total_amount

            # Update payment status based on amount paid vs total
            if total_paid >= total_amount:
                order.payment_status = 'paid'
                order.status = 'paid'
            elif total_paid > 0:
                order.payment_status = 'partially_paid'
                order.status = 'partially_paid'
            else:
                order.payment_status = 'unpaid'

            order.save()

            # Serialize the payment for the response
            payment_data = PaymentSerializer(payment).data

            return Response({
                "status": order.status,
                "order_id": order.id,
                "payment_status": order.payment_status,
                "amount_paid": float(order.total_paid),  # Convert Decimal to float for JSON
                "balance_due": float(order.balance_due),  # Convert Decimal to float for JSON
                "payment": payment_data,
                "message": f"Payment of LKR {amount_paid} has been recorded."
            }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OrderPaymentsListView(generics.ListAPIView):
    """
    Returns a list of all payments for a specific order.
    """
    serializer_class = PaymentSerializer

    def get_queryset(self):
        order_id = self.kwargs.get('pk')
        return Payment.objects.filter(order_id=order_id).order_by('-payment_date')


class ProductSalesView(APIView):
    """
    Returns sales data for a specific product.
    """
    def get(self, request, product_id):
        try:
            # Get all order items for this product
            order_items = OrderItem.objects.filter(
                finished_product_id=product_id
            ).select_related('order', 'order__shop')

            if not order_items.exists():
                return Response({"message": "No sales data found for this product"}, status=status.HTTP_200_OK)

            # Format the response
            sales_data = []
            for item in order_items:
                sales_data.append({
                    'order_id': item.order.id,
                    'shop_name': item.order.shop.name if item.order.shop else "Unknown Shop",
                    'order_date': item.order.created_at,
                    'order_status': item.order.status,
                    'quantity_6_packs': item.quantity_6_packs,
                    'quantity_12_packs': item.quantity_12_packs,
                    'quantity_extra_items': item.quantity_extra_items,
                    'total_units': item.total_units,
                    'subtotal': float(item.subtotal) if item.subtotal else 0,
                    'delivery_date': item.order.delivery_date
                })

            return Response(sales_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
