from rest_framework import serializers
from .models import PackingSession

class PackingSessionSerializer(serializers.ModelSerializer):
    total_packed_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = PackingSession
        fields = ['id', 'finished_product', 'date', 'number_of_6_packs', 'number_of_12_packs', 'extra_items', 'total_packed_quantity']
