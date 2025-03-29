from rest_framework import serializers
from .models import DailySewingRecord,FinishedProduct
from fabric.serializers import FabricVariantSerializer 

class DailySewingRecordSerializer(serializers.ModelSerializer):
    fabric_variant_data = FabricVariantSerializer(read_only=True, source='fabric_variant')
    fabric_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DailySewingRecord
        fields = [
            'id',
            'fabric_variant', # raw ID
            'fabric_variant_data',
            'fabric_name',      # new field for display
            'date',
            'xs',
            's',
            'm',
            'l',
            'xl',
            'damage_count'
        ]
        read_only_fields = ['id', 'date']
    
    def get_fabric_name(self, obj):
        try:
            return obj.fabric_variant.fabric_definition.fabric_name
        except AttributeError:
            return "N/A"
class FinishedProductSerializer(serializers.ModelSerializer):
    fabric_name = serializers.CharField(
        source='fabric_variant.fabric_definition.fabric_name',
        read_only=True
    )

    class Meta:
        model = FinishedProduct
        fields = [
            'id',
            'fabric_name',  # newly added
            'total_sewn_xs',
            'total_sewn_s',
            'total_sewn_m',
            'total_sewn_l',
            'total_sewn_xl',
            'damage_count',
            'last_update_date',
            'status'
        ]