from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import CuttingRecord, CuttingRecordFabric
from fabric.models import FabricVariant
from fabric.serializers import FabricDefinitionSerializer, FabricVariantSerializer


class CuttingRecordFabricSerializer(serializers.ModelSerializer):
    fabric_variant_data = FabricVariantSerializer(read_only=True, source='fabric_variant')

    class Meta:
        model = CuttingRecordFabric
        fields = ['id', 'fabric_variant', 'fabric_variant_data', 'yard_usage', 'xs', 's', 'm', 'l', 'xl']
class CuttingRecordSerializer(serializers.ModelSerializer):
    # Nest the fabric definition and detail rows
    fabric_definition_data = FabricDefinitionSerializer(read_only=True, source='fabric_definition')
    details = CuttingRecordFabricSerializer(many=True)

    class Meta:
        model = CuttingRecord
        fields = ['id', 'fabric_definition', 'fabric_definition_data', 'cutting_date', 'description', 'product_name','details']

    def create(self, validated_data):
        details_data = validated_data.pop('details')
        cutting_record = CuttingRecord.objects.create(**validated_data)
        for detail_data in details_data:
            CuttingRecordFabric.objects.create(cutting_record=cutting_record, **detail_data)
        return cutting_record

    def update(self, instance, validated_data):
        # Update the main CuttingRecord fields
        instance.fabric_definition_id = validated_data.get('fabric_definition', instance.fabric_definition_id)
        instance.cutting_date = validated_data.get('cutting_date', instance.cutting_date)
        instance.description = validated_data.get('description', instance.description)
        instance.product_name = validated_data.get('product_name', instance.product_name)
        instance.save()

        # Handle the nested details
        if 'details' in validated_data:
            details_data = validated_data.pop('details')

            # Keep track of existing detail IDs to identify which ones to keep
            existing_ids = set()

            # First, handle updates to existing details
            for detail_data in details_data:
                detail_id = detail_data.get('id', None)

                if detail_id:
                    # If ID exists, update the existing record
                    try:
                        detail = CuttingRecordFabric.objects.get(id=detail_id, cutting_record=instance)

                        # Store original values for comparison
                        original_variant_id = detail.fabric_variant_id
                        original_yard_usage = detail.yard_usage

                        # Get new values
                        new_variant_id = detail_data.get('fabric_variant', original_variant_id)
                        # Handle case where fabric_variant is an object instead of an ID
                        if new_variant_id and not isinstance(new_variant_id, int):
                            try:
                                if hasattr(new_variant_id, 'id'):
                                    # If it's an object with an ID attribute
                                    new_variant_id = new_variant_id.id
                                else:
                                    # Try to convert to int
                                    new_variant_id = int(new_variant_id)
                            except (ValueError, TypeError, AttributeError):
                                # If conversion fails, keep the original value
                                new_variant_id = original_variant_id

                        new_yard_usage = detail_data.get('yard_usage', original_yard_usage)

                        # Handle fabric variant change
                        if original_variant_id != new_variant_id:
                            # Add yards back to old variant
                            old_variant = detail.fabric_variant
                            old_variant.available_yard = float(old_variant.available_yard) + float(original_yard_usage)
                            old_variant.save()

                            # Subtract yards from new variant
                            new_variant = FabricVariant.objects.get(id=new_variant_id)
                            if float(new_yard_usage) > float(new_variant.available_yard):
                                raise ValidationError(f"Not enough fabric available in the new variant. Maximum available: {new_variant.available_yard} yards.")
                            new_variant.available_yard = float(new_variant.available_yard) - float(new_yard_usage)
                            new_variant.save()

                        # Handle yard usage change (same variant)
                        elif original_yard_usage != new_yard_usage:
                            # Calculate difference
                            yard_difference = float(new_yard_usage) - float(original_yard_usage)

                            # If using more yards, check if enough is available
                            if yard_difference > 0:
                                current_variant = detail.fabric_variant
                                if yard_difference > float(current_variant.available_yard):
                                    raise ValidationError(f"Not enough fabric available. The additional yard usage cannot exceed the remaining fabric. Maximum additional: {current_variant.available_yard} yards.")
                                current_variant.available_yard = float(current_variant.available_yard) - yard_difference
                                current_variant.save()
                            # If using fewer yards, add the difference back
                            elif yard_difference < 0:
                                current_variant = detail.fabric_variant
                                current_variant.available_yard = float(current_variant.available_yard) - yard_difference  # Negative difference, so subtract
                                current_variant.save()

                        # Now update the detail record
                        # Get the FabricVariant instance
                        fabric_variant_instance = FabricVariant.objects.get(id=new_variant_id)

                        # Update the detail record directly
                        # Our model's save method now handles the yard usage validation properly
                        detail.fabric_variant = fabric_variant_instance
                        detail.yard_usage = new_yard_usage
                        detail.xs = detail_data.get('xs', detail.xs)
                        detail.s = detail_data.get('s', detail.s)
                        detail.m = detail_data.get('m', detail.m)
                        detail.l = detail_data.get('l', detail.l)
                        detail.xl = detail_data.get('xl', detail.xl)
                        detail.save()

                        existing_ids.add(detail_id)
                    except CuttingRecordFabric.DoesNotExist:
                        # This is a new detail with a provided ID (shouldn't happen normally)
                        # Handle case where fabric_variant is an object instead of an ID
                        fabric_variant = detail_data.get('fabric_variant')
                        if fabric_variant and not isinstance(fabric_variant, int):
                            try:
                                if hasattr(fabric_variant, 'id'):
                                    # If it's an object with an ID attribute
                                    detail_data['fabric_variant'] = fabric_variant.id
                                else:
                                    # Try to convert to int
                                    detail_data['fabric_variant'] = int(fabric_variant)
                            except (ValueError, TypeError, AttributeError):
                                # Skip this detail if fabric_variant can't be converted to an ID
                                continue

                        # Check if enough fabric is available
                        try:
                            variant = FabricVariant.objects.get(id=detail_data['fabric_variant'])

                            # Get the original yard usage for this variant from any existing details
                            original_usage = 0
                            for existing_detail in instance.details.filter(fabric_variant_id=variant.id):
                                original_usage += float(existing_detail.yard_usage)

                            # Calculate the maximum allowed yard usage
                            max_allowed = float(variant.available_yard) + original_usage

                            if float(detail_data['yard_usage']) > max_allowed:
                                raise ValidationError(f"Not enough fabric available for new detail. Maximum available: {max_allowed} yards.")
                        except FabricVariant.DoesNotExist:
                            raise ValidationError(f"Fabric variant with ID {detail_data['fabric_variant']} does not exist.")

                        # Get the FabricVariant instance
                        fabric_variant_instance = FabricVariant.objects.get(id=detail_data['fabric_variant'])

                        # Create a copy of detail_data without the fabric_variant field
                        detail_data_copy = detail_data.copy()
                        detail_data_copy.pop('fabric_variant', None)

                        # Create the new detail with the FabricVariant instance
                        new_detail = CuttingRecordFabric.objects.create(
                            cutting_record=instance,
                            fabric_variant=fabric_variant_instance,
                            **detail_data_copy
                        )
                        existing_ids.add(new_detail.id)

            # Now handle new details (without IDs)
            for detail_data in [d for d in details_data if not d.get('id')]:
                # Handle case where fabric_variant is an object instead of an ID
                fabric_variant = detail_data.get('fabric_variant')
                if fabric_variant and not isinstance(fabric_variant, int):
                    try:
                        if hasattr(fabric_variant, 'id'):
                            # If it's an object with an ID attribute
                            detail_data['fabric_variant'] = fabric_variant.id
                        else:
                            # Try to convert to int
                            detail_data['fabric_variant'] = int(fabric_variant)
                    except (ValueError, TypeError, AttributeError):
                        # Skip this detail if fabric_variant can't be converted to an ID
                        continue

                # Check if enough fabric is available
                try:
                    variant = FabricVariant.objects.get(id=detail_data['fabric_variant'])

                    # Get the original yard usage for this variant from any existing details
                    original_usage = 0
                    for existing_detail in instance.details.filter(fabric_variant_id=variant.id):
                        original_usage += float(existing_detail.yard_usage)

                    # Calculate the maximum allowed yard usage
                    max_allowed = float(variant.available_yard) + original_usage

                    if float(detail_data['yard_usage']) > max_allowed:
                        raise ValidationError(f"Not enough fabric available for new detail. Maximum available: {max_allowed} yards.")
                except FabricVariant.DoesNotExist:
                    raise ValidationError(f"Fabric variant with ID {detail_data['fabric_variant']} does not exist.")

                # Get the FabricVariant instance
                fabric_variant_instance = FabricVariant.objects.get(id=detail_data['fabric_variant'])

                # Create a copy of detail_data without the fabric_variant field
                detail_data_copy = detail_data.copy()
                detail_data_copy.pop('fabric_variant', None)

                # Create the new detail with the FabricVariant instance
                new_detail = CuttingRecordFabric.objects.create(
                    cutting_record=instance,
                    fabric_variant=fabric_variant_instance,
                    **detail_data_copy
                )
                existing_ids.add(new_detail.id)

            # Delete details that weren't included in the update
            # Only if we have details in the request (to avoid deleting everything if details is empty)
            if details_data:
                # Get details that will be deleted
                details_to_delete = instance.details.exclude(id__in=existing_ids)

                # For each detail being deleted, add the yards back to the fabric variant
                for detail in details_to_delete:
                    variant = detail.fabric_variant
                    variant.available_yard = float(variant.available_yard) + float(detail.yard_usage)
                    variant.save()

                # Now delete the details
                details_to_delete.delete()

        return instance