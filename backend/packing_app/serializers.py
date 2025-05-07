from rest_framework import serializers
from .models import PackingSession, PackingInventory
from finished_product.models import FinishedProduct

class PackingSessionSerializer(serializers.ModelSerializer):
    total_packed_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = PackingSession
        fields = ['id', 'finished_product', 'date', 'number_of_6_packs', 'number_of_12_packs', 'extra_items', 'total_packed_quantity']

class PackingSessionHistorySerializer(serializers.ModelSerializer):
    total_packed_quantity = serializers.IntegerField(read_only=True)
    product_name = serializers.SerializerMethodField()
    date_formatted = serializers.SerializerMethodField()

    class Meta:
        model = PackingSession
        fields = [
            'id',
            'finished_product',
            'product_name',
            'date',
            'date_formatted',
            'number_of_6_packs',
            'number_of_12_packs',
            'extra_items',
            'total_packed_quantity'
        ]

    def get_product_name(self, obj):
        try:
            return obj.finished_product.cutting_record.product_name
        except:
            return f"Product #{obj.finished_product_id}"

    def get_date_formatted(self, obj):
        return obj.date.strftime("%B %d, %Y")


class PackingInventorySerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_id = serializers.SerializerMethodField()
    total_quantity = serializers.IntegerField(read_only=True)
    color_code = serializers.SerializerMethodField()

    class Meta:
        model = PackingInventory
        fields = [
            'id',
            'product_id',
            'product_name',
            'number_of_6_packs',
            'number_of_12_packs',
            'extra_items',
            'total_quantity',
            'color_code'
        ]

    def get_product_name(self, obj):
        try:
            return obj.finished_product.cutting_record.product_name
        except:
            return f"Product #{obj.finished_product_id}"

    def get_product_id(self, obj):
        return obj.finished_product.id

    def get_color_code(self, obj):
        try:
            return obj.finished_product.cutting_record.fabric.color
        except:
            return "#CCCCCC"  # Default gray color if no color is found
