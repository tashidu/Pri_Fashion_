from rest_framework import serializers
from django.db.models import Sum
from sewing.models import DailySewingRecord

class DailySewingRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySewingRecord
        fields = [
            'id',
            'cutting_detail',
            'date',
            'xs',
            's',
            'm',
            'l',
            'xl',
            'damage_count'
        ]
        read_only_fields = ['id', 'date']

    def validate(self, data):
        cutting_detail = data.get('cutting_detail')
        if not cutting_detail:
            return data  # Let the required field validation handle it

        # Calculate the total sewing count for the current record
        new_daily_total = (
            data.get('xs', 0) +
            data.get('s', 0) +
            data.get('m', 0) +
            data.get('l', 0) +
            data.get('xl', 0)
        )

        # Get the sum of all existing sewing records for this cutting_detail
        existing_agg = cutting_detail.daily_sewing_records.aggregate(
            xs_total=Sum('xs'),
            s_total=Sum('s'),
            m_total=Sum('m'),
            l_total=Sum('l'),
            xl_total=Sum('xl')
        )
        existing_total = (
            (existing_agg.get('xs_total') or 0) +
            (existing_agg.get('s_total') or 0) +
            (existing_agg.get('m_total') or 0) +
            (existing_agg.get('l_total') or 0) +
            (existing_agg.get('xl_total') or 0)
        )

        total_after = existing_total + new_daily_total

        # Calculate the total cut available in the cutting detail
        total_cut = (
            cutting_detail.xs +
            cutting_detail.s +
            cutting_detail.m +
            cutting_detail.l +
            cutting_detail.xl
        )

        if total_after > total_cut:
            raise serializers.ValidationError(
                "The total sewing count (existing plus new) exceeds the available cutting quantity."
            )

        return data


class DailySewingRecordHistorySerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()

    class Meta:
        model = DailySewingRecord
        fields = [
            'date',
            'product_name',
            'color',
            'xs',
            's',
            'm',
            'l',
            'xl',
            'damage_count'
        ]
        read_only_fields = ['date']

    def get_product_name(self, obj):
        try:
            product = obj.cutting_detail.cutting_record
            return product.product_name or f"{product.fabric_definition.fabric_name} cut on {product.cutting_date}"
        except Exception as e:
            return "N/A"

    def get_color(self, obj):
        try:
            variant = obj.cutting_detail.fabric_variant
            return getattr(variant, 'color_name', None) or getattr(variant, 'color', "N/A")
        except Exception as e:
            return "N/A"
