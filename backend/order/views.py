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
from authentication.permissions import IsOwner, IsInventoryManager, IsOrderCoordinator, IsSalesTeam

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
    permission_classes = [IsAuthenticated]  # Any authenticated user can list/create orders
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]  # Any authenticated user can view order details
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderApproveView(APIView):
    """
    Allows owners or sales team to approve submitted orders.
    """
    permission_classes = [IsAuthenticated]  # Allow any authenticated user to approve orders
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)

            # Check if the user is from the sales team
            user_role = request.user.role.name if hasattr(request.user, 'role') else None
            is_sales_team = user_role == 'Sales Team'

            # For sales team, allow any status to be approved
            # For other roles, enforce the submitted-to-approved workflow
            if not is_sales_team and order.status != 'submitted':
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
    permission_classes = [IsAuthenticated]  # Any authenticated user can create order items
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

        # Check user role for validation
        user_role = self.request.user.role.name if hasattr(self.request.user, 'role') else None

        # For Order Coordinators, strictly validate inventory
        # For Sales Team, allow orders even if inventory is insufficient
        if user_role != 'Sales Team':
            # Validate stock before deduction for non-Sales Team users
            if (inventory.number_of_6_packs < six_packs or
                inventory.number_of_12_packs < twelve_packs or
                inventory.extra_items < extras):
                raise serializers.ValidationError({'error': 'Not enough inventory to fulfill the order.'})
        else:
            # For Sales Team, check if there are items in production
            total_requested = six_packs * 6 + twelve_packs * 12 + extras
            total_available = inventory.number_of_6_packs * 6 + inventory.number_of_12_packs * 12 + inventory.extra_items

            # Calculate total sewn items
            total_sewn = (
                finished_product.total_sewn_xs +
                finished_product.total_sewn_s +
                finished_product.total_sewn_m +
                finished_product.total_sewn_l +
                finished_product.total_sewn_xl
            )

            # Items in production = total sewn - items in inventory
            in_production = max(0, total_sewn - total_available)

            # If there's not enough in stock AND no items in production, reject the order
            if total_requested > total_available and in_production == 0:
                raise serializers.ValidationError({
                    'error': 'Not enough inventory to fulfill the order and no items in production.'
                })

            # If there's not enough in stock but there are items in production,
            # allow the order but add a note
            if total_requested > total_available and in_production > 0:
                # Add a note to the order about using items from production
                if not order.owner_notes:
                    order.owner_notes = ""
                order.owner_notes += f"\n[Note: This order includes {total_requested - total_available} items from production]"
                order.save()

        # Save order item and deduct inventory (or mark as pending)
        serializer.save(order=order, finished_product=finished_product)

        # Only deduct from inventory what's available
        deduct_six_packs = min(six_packs, inventory.number_of_6_packs)
        deduct_twelve_packs = min(twelve_packs, inventory.number_of_12_packs)
        deduct_extras = min(extras, inventory.extra_items)

        if deduct_six_packs > 0 or deduct_twelve_packs > 0 or deduct_extras > 0:
            inventory.deduct_for_order(deduct_six_packs, deduct_twelve_packs, deduct_extras)




class OrderSubmitView(APIView):
    """
    Lets Order Coordinator or Sales Team mark an order as 'submitted' (finished preparing).
    """
    permission_classes = [IsAuthenticated]  # Allow any authenticated user to submit orders

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)

            # Check if the user is from the sales team
            user_role = request.user.role.name if hasattr(request.user, 'role') else None
            is_sales_team = user_role == 'Sales Team'

            # For sales team, allow any status to be submitted
            # For other roles, enforce the draft-to-submitted workflow
            if not is_sales_team and order.status != 'draft':
                return Response({"error": "Only draft orders can be submitted."}, status=status.HTTP_400_BAD_REQUEST)

            order.status = 'submitted'
            order.save()

            return Response({"status": "submitted", "order_id": order.id}, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)




class GenerateInvoiceView(APIView):
    """
    Allows owners or sales team to generate an invoice for an approved order.
    """
    permission_classes = [IsAuthenticated]  # Allow any authenticated user to generate invoices
    def post(self, request, pk):
        try:
            order = Order.objects.prefetch_related('items__finished_product').get(pk=pk)

            # Check if the user is from the sales team
            user_role = request.user.role.name if hasattr(request.user, 'role') else None
            is_sales_team = user_role == 'Sales Team'

            # For sales team, allow any status to be invoiced
            # For other roles, enforce the approved-to-invoiced workflow
            if not is_sales_team and order.status != 'approved':
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
    permission_classes = [IsAuthenticated, IsSalesTeam]  # Only sales team can mark orders as delivered
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
    permission_classes = [IsAuthenticated, IsOwner]  # Only owners can record payments
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
    permission_classes = [IsAuthenticated, IsOwner]  # Only owners can view payment details
    serializer_class = PaymentSerializer

    def get_queryset(self):
        order_id = self.kwargs.get('pk')
        return Payment.objects.filter(order_id=order_id).order_by('-payment_date')


class ProductSalesView(APIView):
    """
    Returns sales data for a specific product.
    """
    permission_classes = [IsAuthenticated]  # Any authenticated user can view product sales data
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


class RevertOrderView(APIView):
    """
    Allows owners to revert unpaid orders and create new packing sessions to restore inventory.
    This is used when shops reject orders after delivery or during processing.
    """
    permission_classes = [IsAuthenticated, IsOwner]  # Only owners can revert orders

    def post(self, request, pk):
        try:
            from packing_app.models import PackingSession
            from django.utils import timezone

            order = Order.objects.prefetch_related('items__finished_product').get(pk=pk)

            # Check if the order is in a state that can be reverted
            # Only delivered or invoiced orders that are unpaid can be reverted
            if order.payment_status == 'paid' or order.payment_status == 'partially_paid':
                return Response(
                    {"error": "Cannot revert orders that have been paid or partially paid."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if order.status not in ['draft', 'delivered', 'invoiced']:
                return Response(
                    {"error": "Only draft, delivered, or invoiced orders can be reverted."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process each order item to create new packing sessions
            restored_items = []
            packing_sessions_created = []

            for item in order.items.all():
                # Create a new packing session for this product
                if item.quantity_6_packs > 0 or item.quantity_12_packs > 0 or item.quantity_extra_items > 0:
                    packing_session = PackingSession.objects.create(
                        finished_product=item.finished_product,
                        date=timezone.now().date(),
                        number_of_6_packs=item.quantity_6_packs,
                        number_of_12_packs=item.quantity_12_packs,
                        extra_items=item.quantity_extra_items
                    )

                    # Update the packing inventory
                    inventory, created = PackingInventory.objects.get_or_create(
                        finished_product=item.finished_product
                    )
                    inventory.update_from_session(packing_session)

                    packing_sessions_created.append({
                        'id': packing_session.id,
                        'product_id': item.finished_product.id,
                        'date': packing_session.date.isoformat()
                    })

                # Add to restored items list for the response
                restored_items.append({
                    'product_id': item.finished_product.id,
                    'product_name': item.finished_product.cutting_record.product_name if hasattr(item.finished_product, 'cutting_record') else f"Product #{item.finished_product.id}",
                    'six_packs': item.quantity_6_packs,
                    'twelve_packs': item.quantity_12_packs,
                    'extras': item.quantity_extra_items,
                    'total_units': item.total_units
                })

            # Store order details before deletion
            order_id = order.id
            shop_name = order.shop.name if order.shop else "Unknown Shop"

            # Delete the order
            order.delete()

            return Response({
                "message": f"Order #{order_id} for {shop_name} has been reverted and deleted. New packing sessions have been created to restore inventory.",
                "restored_items": restored_items,
                "packing_sessions_created": packing_sessions_created
            }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OrderSummaryView(APIView):
    """
    Returns summary data for orders, including counts by status and total units sold.
    """
    permission_classes = [IsAuthenticated]  # Any authenticated user can view order summary

    def get(self, request):
        try:
            # Get all orders
            orders = Order.objects.all()

            # Count orders by status
            draft_count = orders.filter(status='draft').count()
            submitted_count = orders.filter(status='submitted').count()
            approved_count = orders.filter(status='approved').count()
            invoiced_count = orders.filter(status='invoiced').count()
            delivered_count = orders.filter(status='delivered').count()
            paid_count = orders.filter(status='paid').count()
            partially_paid_count = orders.filter(status='partially_paid').count()
            payment_due_count = orders.filter(status='payment_due').count()

            # Calculate total units sold (delivered)
            delivered_orders = orders.filter(status__in=['delivered', 'paid', 'partially_paid', 'payment_due'])

            # Get all order items for delivered orders
            order_items = OrderItem.objects.filter(order__in=delivered_orders)

            # Calculate total units
            total_sold = 0
            for item in order_items:
                total_sold += item.total_units

            # Calculate total pending (approved + invoiced)
            pending_orders = orders.filter(status__in=['approved', 'invoiced'])
            pending_items = OrderItem.objects.filter(order__in=pending_orders)
            total_pending = 0
            for item in pending_items:
                total_pending += item.total_units

            # Format the response
            summary_data = {
                'order_counts': {
                    'draft': draft_count,
                    'submitted': submitted_count,
                    'approved': approved_count,
                    'invoiced': invoiced_count,
                    'delivered': delivered_count,
                    'paid': paid_count,
                    'partially_paid': partially_paid_count,
                    'payment_due': payment_due_count,
                    'total': orders.count()
                },
                'total_sold': total_sold,
                'total_pending': total_pending,
                'delivered': delivered_count,
                'pending': approved_count + invoiced_count,
                'cancelled': 0  # Add this field if you have a cancelled status
            }

            return Response(summary_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
