from rest_framework import serializers
from .models import PackingSession
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
