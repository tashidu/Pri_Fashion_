from rest_framework import serializers
from .models import Fabric, Supplier

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'  # Include all fields

class FabricSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer()  # Nest supplier details inside fabric data

    class Meta:
        model = Fabric
        fields = '__all__'
