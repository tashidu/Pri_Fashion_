# sewing/serializers.py
from rest_framework import serializers
from .models import DailySewingRecord

class DailySewingRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySewingRecord
        fields = [
            'id',
            'cutting_detail',  # Reference to the specific cutting record detail
            'date',
            'xs',
            's',
            'm',
            'l',
            'xl',
            'damage_count'
        ]
        read_only_fields = ['id', 'date']
