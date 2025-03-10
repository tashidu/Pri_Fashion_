from rest_framework import serializers
from .models import Fabric, Supplier

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'  # Include all fields

class FabricSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fabric
        fields = ['id', 'name', 'color', 'total_yard', 'supplier', 'price_per_yard']  # Add price_per_yard here
    class Meta:
        model = Fabric
        fields = '__all__'
