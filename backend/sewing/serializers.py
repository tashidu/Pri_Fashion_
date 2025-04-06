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
            return data

        new_xs = data.get('xs', 0)
        new_s  = data.get('s', 0)
        new_m  = data.get('m', 0)
        new_l  = data.get('l', 0)
        new_xl = data.get('xl', 0)

        # ✅ Exclude current instance in case of update
        sewing_qs = cutting_detail.daily_sewing_records.all()
        if self.instance:
            sewing_qs = sewing_qs.exclude(id=self.instance.id)

        # ✅ Aggregate existing sewing records
        agg = sewing_qs.aggregate(
            sewn_xs=Sum('xs'),
            sewn_s=Sum('s'),
            sewn_m=Sum('m'),
            sewn_l=Sum('l'),
            sewn_xl=Sum('xl'),
        )

        sewn_xs = agg.get('sewn_xs') or 0
        sewn_s  = agg.get('sewn_s')  or 0
        sewn_m  = agg.get('sewn_m')  or 0
        sewn_l  = agg.get('sewn_l')  or 0
        sewn_xl = agg.get('sewn_xl') or 0

        # ✅ Print debug info temporarily
        print("Cutting XS:", cutting_detail.xs, "Sewn:", sewn_xs, "New:", new_xs)
        print("Cutting S :", cutting_detail.s,  "Sewn:", sewn_s,  "New:", new_s)
        print("Cutting M :", cutting_detail.m,  "Sewn:", sewn_m,  "New:", new_m)
        print("Cutting L :", cutting_detail.l,  "Sewn:", sewn_l,  "New:", new_l)
        print("Cutting XL:", cutting_detail.xl, "Sewn:", sewn_xl, "New:", new_xl)

        if (sewn_xs + new_xs) > cutting_detail.xs:
            raise serializers.ValidationError("XS exceeds cutting quantity.")
        if (sewn_s + new_s) > cutting_detail.s:
            raise serializers.ValidationError("S exceeds cutting quantity.")
        if (sewn_m + new_m) > cutting_detail.m:
            raise serializers.ValidationError("M exceeds cutting quantity.")
        if (sewn_l + new_l) > cutting_detail.l:
            raise serializers.ValidationError("L exceeds cutting quantity.")
        if (sewn_xl + new_xl) > cutting_detail.xl:
            raise serializers.ValidationError("XL exceeds cutting quantity.")

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
        except Exception:
            return "N/A"

    def get_color(self, obj):
        try:
            variant = obj.cutting_detail.fabric_variant
            return getattr(variant, 'color_name', None) or getattr(variant, 'color', "N/A")
        except Exception:
            return "N/A"
