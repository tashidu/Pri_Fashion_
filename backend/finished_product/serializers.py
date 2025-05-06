# finished_product/serializers.py
from rest_framework import serializers
from finished_product.models import FinishedProduct
from cutting.models import CuttingRecord
from packing_app.models import PackingInventory

class FinishedProductApprovalSerializer(serializers.ModelSerializer):
    # Allow the owner to provide a cutting record ID.
    cutting_record = serializers.IntegerField(write_only=True)

    class Meta:
        model = FinishedProduct
        fields = ['cutting_record', 'manufacture_price', 'selling_price', 'product_image']

    def create(self, validated_data):
        cutting_record_id = validated_data.pop('cutting_record')
        try:
            cutting_record = CuttingRecord.objects.get(pk=cutting_record_id)
        except CuttingRecord.DoesNotExist:
            raise serializers.ValidationError("Cutting record not found.")

        if hasattr(cutting_record, 'finished_product'):
            raise serializers.ValidationError("This batch has already been approved.")

        # Extract product image if provided
        product_image = validated_data.pop('product_image', None)

        finished_product = FinishedProduct.objects.create(
            cutting_record=cutting_record,
            manufacture_price=validated_data['manufacture_price'],
            selling_price=validated_data['selling_price'],
            product_image=product_image,
            is_provisional=True  # Mark as provisional.
        )
        finished_product.update_totals()  # Aggregate the sewing totals.
        return finished_product


class FinishedProductReportSerializer(serializers.ModelSerializer):
    total_clothing = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = FinishedProduct
        fields = [
            'id',
            'product_name',
            'manufacture_price',
            'selling_price',
            'total_sewn_xs',
            'total_sewn_s',
            'total_sewn_m',
            'total_sewn_l',
            'total_sewn_xl',
            'approval_date',
            'total_clothing',
            'product_image'
        ]

    def get_total_clothing(self, obj):
        return (
            (obj.total_sewn_xs or 0) +
            (obj.total_sewn_s or 0) +
            (obj.total_sewn_m or 0) +
            (obj.total_sewn_l or 0) +
            (obj.total_sewn_xl or 0)
        )

    def get_product_name(self, obj):
        # Derive the product name from the linked cutting record.
        if obj.cutting_record.product_name:
            return obj.cutting_record.product_name
        else:
            return f"{obj.cutting_record.fabric_definition.fabric_name} cut on {obj.cutting_record.cutting_date}"

    def get_product_image(self, obj):
        # Return the image URL if available
        request = self.context.get('request')
        if obj.product_image and request:
            return request.build_absolute_uri(obj.product_image.url)
        return None


class FinishedProductImageSerializer(serializers.ModelSerializer):
    """
    Serializer for updating just the product image of a finished product.
    """
    class Meta:
        model = FinishedProduct
        fields = ['product_image']


class SalesProductSerializer(serializers.ModelSerializer):
    """
    Serializer for the sales team product view.
    Includes product image, stock levels, and selling price.
    """
    product_name = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    packing_inventory = serializers.SerializerMethodField()
    available_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = FinishedProduct
        fields = [
            'id',
            'product_name',
            'selling_price',
            'product_image',
            'available_quantity',
            'packing_inventory'
        ]

    def get_product_name(self, obj):
        if obj.cutting_record.product_name:
            return obj.cutting_record.product_name
        else:
            return f"{obj.cutting_record.fabric_definition.fabric_name} cut on {obj.cutting_record.cutting_date}"

    def get_product_image(self, obj):
        request = self.context.get('request')
        if obj.product_image and request:
            return request.build_absolute_uri(obj.product_image.url)
        return None

    def get_packing_inventory(self, obj):
        try:
            inventory = PackingInventory.objects.get(finished_product=obj)
            return {
                'number_of_6_packs': inventory.number_of_6_packs,
                'number_of_12_packs': inventory.number_of_12_packs,
                'extra_items': inventory.extra_items,
                'total_quantity': inventory.total_quantity
            }
        except PackingInventory.DoesNotExist:
            return {
                'number_of_6_packs': 0,
                'number_of_12_packs': 0,
                'extra_items': 0,
                'total_quantity': 0
            }
