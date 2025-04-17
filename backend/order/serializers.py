# order/serializers.py
from rest_framework import serializers
from .models import Shop, Order, OrderItem
from finished_product.models import FinishedProduct

class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ['id', 'name', 'address', 'contact_number']

class OrderItemSerializer(serializers.ModelSerializer):
    finished_product_name = serializers.ReadOnlyField(source='finished_product.cutting_record.product_name')
    subtotal = serializers.ReadOnlyField()
    total_units = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'finished_product', 'finished_product_name',
                  'quantity_6_packs', 'quantity_12_packs', 'quantity_extra_items',
                  'total_units', 'subtotal']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_amount = serializers.ReadOnlyField()
    shop_name = serializers.ReadOnlyField(source='shop.name')

    class Meta:
        model = Order
        fields = ['id', 'shop', 'shop_name', 'placed_by', 'created_at',
                  'status', 'approval_date', 'invoice_number', 'total_amount', 'items']
