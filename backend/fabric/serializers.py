from rest_framework import serializers
from .models import Fabric, Supplier

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['supplier_id', 'name', 'address', 'tel_no']
class FabricSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = Fabric
        fields = [
            'id', 
            'name', 
            'color', 
            'total_yard', 
            'price_per_yard',  # Ensure this field is included
            'supplier',        # Accept supplier ID on POST
            'supplier_name'    # For display purposes, read-only
        ]