# finished_product/serializers.py
from rest_framework import serializers
from finished_product.models import FinishedProduct
from cutting.models import CuttingRecord

class FinishedProductApprovalSerializer(serializers.ModelSerializer):
    # Allow the owner to provide a cutting record ID.
    cutting_record = serializers.IntegerField(write_only=True)

    class Meta:
        model = FinishedProduct
        fields = ['cutting_record', 'manufacture_price', 'selling_price']

    def create(self, validated_data):
        cutting_record_id = validated_data.pop('cutting_record')
        try:
            cutting_record = CuttingRecord.objects.get(pk=cutting_record_id)
        except CuttingRecord.DoesNotExist:
            raise serializers.ValidationError("Cutting record not found.")

        if hasattr(cutting_record, 'finished_product'):
            raise serializers.ValidationError("This batch has already been approved.")

        finished_product = FinishedProduct.objects.create(
            cutting_record=cutting_record,
            manufacture_price=validated_data['manufacture_price'],
            selling_price=validated_data['selling_price'],
            is_provisional=True  # Mark as provisional.
        )
        finished_product.update_totals()  # Aggregate the sewing totals.
        return finished_product
