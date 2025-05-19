from rest_framework import serializers
from .models import Supplier, FabricDefinition, FabricVariant


COLOR_MAP = {
    "#000000": "Black",
    "#FFFFFF": "White",
    "#6f2f2f": "Dark Red",
    # add other mappings as needed
}
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
            'color_name',
            'total_yard',
            'available_yard',
            'price_per_yard',
            'fabric_definition'
        ]

    def create(self, validated_data):
        color_code = validated_data.get('color')
        validated_data['color_name'] = COLOR_MAP.get(color_code, color_code)
        return super().create(validated_data)

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


class FabricDefinitionDetailSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    variant_count = serializers.SerializerMethodField()

    class Meta:
        model = FabricDefinition
        fields = ['id', 'fabric_name', 'supplier', 'supplier_name', 'date_added', 'variant_count']

    def get_variant_count(self, obj):
        return obj.variants.count()
