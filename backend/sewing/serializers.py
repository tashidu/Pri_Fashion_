from rest_framework import serializers
from django.db.models import Sum
from sewing.models import DailySewingRecord

class DailySewingRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySewingRecord
        fields = [
            'id',
            'cutting_record_fabric',
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
        cutting_record_fabric = data.get('cutting_record_fabric')
        if not cutting_record_fabric:
            return data

        new_xs = data.get('xs', 0)
        new_s  = data.get('s', 0)
        new_m  = data.get('m', 0)
        new_l  = data.get('l', 0)
        new_xl = data.get('xl', 0)
        new_damage = data.get('damage_count', 0)

        # ✅ Exclude current instance if updating
        sewing_qs = cutting_record_fabric.daily_sewing_records.all()
        if self.instance:
            sewing_qs = sewing_qs.exclude(id=self.instance.id)

        # ✅ Aggregate existing sewing records
        agg = sewing_qs.aggregate(
            sewn_xs=Sum('xs'),
            sewn_s=Sum('s'),
            sewn_m=Sum('m'),
            sewn_l=Sum('l'),
            sewn_xl=Sum('xl'),
            damage_sum=Sum('damage_count'),
        )

        sewn_xs = agg.get('sewn_xs') or 0
        sewn_s  = agg.get('sewn_s')  or 0
        sewn_m  = agg.get('sewn_m')  or 0
        sewn_l  = agg.get('sewn_l')  or 0
        sewn_xl = agg.get('sewn_xl') or 0
        total_damage = agg.get('damage_sum') or 0

        # Check individual size limits
        if (sewn_xs + new_xs) > cutting_record_fabric.xs:
            raise serializers.ValidationError("XS exceeds cutting quantity.")
        if (sewn_s + new_s) > cutting_record_fabric.s:
            raise serializers.ValidationError("S exceeds cutting quantity.")
        if (sewn_m + new_m) > cutting_record_fabric.m:
            raise serializers.ValidationError("M exceeds cutting quantity.")
        if (sewn_l + new_l) > cutting_record_fabric.l:
            raise serializers.ValidationError("L exceeds cutting quantity.")
        if (sewn_xl + new_xl) > cutting_record_fabric.xl:
            raise serializers.ValidationError("XL exceeds cutting quantity.")

        # Calculate total cut and total sewn
        total_cut = cutting_record_fabric.xs + cutting_record_fabric.s + cutting_record_fabric.m + cutting_record_fabric.l + cutting_record_fabric.xl
        total_sewn = sewn_xs + sewn_s + sewn_m + sewn_l + sewn_xl
        new_total_sewn = new_xs + new_s + new_m + new_l + new_xl

        # Check if total sewn + damage exceeds total cut
        if (total_sewn + new_total_sewn + total_damage + new_damage) > total_cut:
            raise serializers.ValidationError("Total sewn items plus damage count exceeds the total cut quantity.")

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
            product = obj.cutting_record_fabric.cutting_record
            return product.product_name or f"{product.fabric_definition.fabric_name} cut on {product.cutting_date}"
        except Exception:
            return "N/A"

    def get_color(self, obj):
        try:
            variant = obj.cutting_record_fabric.fabric_variant
            return getattr(variant, 'color_name', None) or getattr(variant, 'color', "N/A")
        except Exception:
            return "N/A"

