# reports/serializers.py
from rest_framework import serializers
from finished_product.models import FinishedProduct
from packing_app.models import PackingSession
from django.db.models import Sum, F

class ProductPackingReportSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    total_sewn = serializers.SerializerMethodField()
    total_packed = serializers.SerializerMethodField()
    current_inventory = serializers.SerializerMethodField()

    class Meta:
        model = FinishedProduct
        fields = [
            'id',
            'product_name',
            'approval_date',
            'total_sewn',
            'total_packed',
            'current_inventory',
            'available_quantity',
        ]

    def get_product_name(self, obj):
        return obj.cutting_record.product_name or f"Batch {obj.cutting_record.id}"

    def get_total_sewn(self, obj):
        return (
            obj.total_sewn_xs +
            obj.total_sewn_s +
            obj.total_sewn_m +
            obj.total_sewn_l +
            obj.total_sewn_xl
        )

    def get_total_packed(self, obj):
        return PackingSession.objects.filter(finished_product=obj).aggregate(
            total=Sum(
                F('number_of_6_packs') * 6 +
                F('number_of_12_packs') * 12 +
                F('extra_items')
            )
        )['total'] or 0

    def get_current_inventory(self, obj):
        inventory = getattr(obj, 'packinginventory', None)
        return inventory.total_quantity if inventory else 0
