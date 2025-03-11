from rest_framework import serializers
from .models import Fabric, Supplier

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'  # Include all fields
class FabricSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name')  # Show supplier name # Fetch supplier name

    class Meta:
        model = Fabric
        fields = ['id', 'name', 'color', 'total_yard', 'supplier_name']
