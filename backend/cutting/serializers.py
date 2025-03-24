from rest_framework import serializers
from .models import CuttingRecord, CuttingRecordFabric
from fabric.serializers import FabricDefinitionSerializer, FabricVariantSerializer


class CuttingRecordFabricSerializer(serializers.ModelSerializer):
    fabric_variant_data = FabricVariantSerializer(read_only=True, source='fabric_variant')

    class Meta:
        model = CuttingRecordFabric
        fields = ['id', 'fabric_variant', 'fabric_variant_data', 'yard_usage', 'xs', 's', 'm', 'l', 'xl']
class CuttingRecordSerializer(serializers.ModelSerializer):
    # Nest the fabric definition and detail rows
    fabric_definition_data = FabricDefinitionSerializer(read_only=True, source='fabric_definition')
    details = CuttingRecordFabricSerializer(many=True)
    
    class Meta:
        model = CuttingRecord
        fields = ['id', 'fabric_definition', 'fabric_definition_data', 'cutting_date', 'description', 'details']

    def create(self, validated_data):
        details_data = validated_data.pop('details')
        cutting_record = CuttingRecord.objects.create(**validated_data)
        for detail_data in details_data:
            CuttingRecordFabric.objects.create(cutting_record=cutting_record, **detail_data)
        return cutting_record