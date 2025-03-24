from rest_framework import serializers
from .models import DailySewingRecord

class DailySewingRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySewingRecord
        fields = [
            'id',
            'fabric_variant',  # User will post the ID of the selected FabricVariant
            'date',            # Auto-set on creation
            'xs',
            's',
            'm',
            'l',
            'xl',
            'damage_count'
        ]
        read_only_fields = ['id', 'date']
