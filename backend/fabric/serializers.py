from rest_framework import serializers
from .models import Supplier, FabricDefinition, FabricVariant

class SupplierSerializer(serializers.ModelSerializer):
  
    class Meta:
        model = Supplier
        fields = ['supplier_id', 'name', 'address', 'tel_no']

class FabricVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = FabricVariant
        fields = [
            'id', 
            'color', 
            'total_yard', 
            'price_per_yard',
            'fabric_definition'
        ]

class FabricDefinitionSerializer(serializers.ModelSerializer):
    # Optionally include variants in the same response
    variants = FabricVariantSerializer(many=True, read_only=True)

    class Meta:
        model = FabricDefinition
        fields = [
            'id', 
            'fabric_name', 
            'supplier', 
            'date_added',
            'variants'
        ]