# order/serializers.py
from rest_framework import serializers
from .models import Shop, Order, OrderItem, Payment
from finished_product.models import FinishedProduct

class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ['id', 'name', 'address', 'contact_number', 'district', 'latitude', 'longitude']

class OrderItemSerializer(serializers.ModelSerializer):
    finished_product_name = serializers.ReadOnlyField(source='finished_product.cutting_record.product_name')
    subtotal = serializers.ReadOnlyField()
    total_units = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'finished_product', 'finished_product_name',
                  'quantity_6_packs', 'quantity_12_packs', 'quantity_extra_items',
                  'total_units', 'subtotal']


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Payment model.
    """
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'amount', 'payment_method', 'payment_date', 'notes',
            'check_number', 'check_date', 'bank_name',
            'credit_term_months', 'payment_due_date'
        ]
        read_only_fields = ['id']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_amount = serializers.ReadOnlyField()
    balance_due = serializers.ReadOnlyField()
    is_payment_overdue = serializers.ReadOnlyField()
    shop_name = serializers.ReadOnlyField(source='shop.name')
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'shop', 'shop_name', 'placed_by', 'created_at',
            'status', 'approval_date', 'invoice_number', 'total_amount',
            # Delivery fields
            'delivery_date', 'delivered_items_count', 'delivery_notes',
            # Payment fields
            'payment_method', 'payment_status', 'amount_paid', 'payment_date',
            'balance_due', 'is_payment_overdue',
            # Check payment details
            'check_number', 'check_date', 'bank_name',
            # Credit payment details
            'payment_due_date', 'credit_term_months',
            # Owner notes
            'owner_notes',
            # Direct sale flag
            'direct_sale',
            # Items
            'items',
            # Payments
            'payments'
        ]
