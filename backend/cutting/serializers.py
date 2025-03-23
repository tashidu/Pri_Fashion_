from rest_framework import serializers
from .models import CuttingRecord, CuttingRecordFabric

class CuttingRecordFabricSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuttingRecordFabric
        fields = ['id', 'fabric_variant', 'yard_usage', 'xs', 's', 'm', 'l', 'xl']

class CuttingRecordSerializer(serializers.ModelSerializer):
    details = CuttingRecordFabricSerializer(many=True)

    class Meta:
        model = CuttingRecord
        fields = ['id', 'fabric_definition', 'cutting_date', 'description', 'details']

    def create(self, validated_data):
        details_data = validated_data.pop('details')
        cutting_record = CuttingRecord.objects.create(**validated_data)
        for detail_data in details_data:
            CuttingRecordFabric.objects.create(cutting_record=cutting_record, **detail_data)
        return cutting_record
