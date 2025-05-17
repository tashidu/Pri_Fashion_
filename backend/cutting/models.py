from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from fabric.models import FabricDefinition, FabricVariant


class CuttingRecord(models.Model):
    # Reference the FabricDefinition to get the fabric name
    fabric_definition = models.ForeignKey(FabricDefinition, on_delete=models.CASCADE)
    cutting_date = models.DateField(default=timezone.now)
    description = models.TextField(null=True, blank=True)
    product_name = models.CharField(max_length=100, null=True, blank=True)  # Optional field



    def __str__(self):
        if self.product_name:
            return self.product_name
        return f"{self.fabric_definition.fabric_name} cut on {self.cutting_date}"




class CuttingRecordFabric(models.Model):
    cutting_record = models.ForeignKey(
        CuttingRecord, on_delete=models.CASCADE, related_name='details'
    )
    # Reference the FabricVariant to select the correct variant (color)
    fabric_variant = models.ForeignKey(FabricVariant, on_delete=models.CASCADE)
    yard_usage = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total yards used for this variant")

    # Quantity breakdown per size
    xs = models.IntegerField(default=0)
    s = models.IntegerField(default=0)
    m = models.IntegerField(default=0)
    l = models.IntegerField(default=0)
    xl = models.IntegerField(default=0)

    def __str__(self):
        return (f"{self.fabric_variant} - "
                f"XS: {self.xs}, S: {self.s}, M: {self.m}, L: {self.l}, XL: {self.xl}")

    def save(self, *args, **kwargs):
        # Check if this is an update or a new record
        is_update = self.pk is not None

        # If this is an update, get the original record to compare yard usage
        if is_update:
            try:
                # Get the original record before changes
                original = CuttingRecordFabric.objects.get(pk=self.pk)
                original_yard_usage = float(original.yard_usage)

                # If the fabric variant has changed, handle both variants
                if original.fabric_variant_id != self.fabric_variant_id:
                    # Add yards back to the old variant
                    old_variant = original.fabric_variant
                    old_variant.available_yard = float(old_variant.available_yard) + original_yard_usage
                    old_variant.save()

                    # Check if enough yards are available in the new variant
                    new_variant = self.fabric_variant
                    if float(self.yard_usage) > float(new_variant.available_yard):
                        raise ValidationError("Not enough fabric available in the new variant.")

                    # Subtract yards from the new variant
                    new_variant.available_yard = float(new_variant.available_yard) - float(self.yard_usage)
                    new_variant.save()

                # If only the yard usage has changed (same variant)
                elif original_yard_usage != float(self.yard_usage):
                    # Calculate the difference
                    yard_difference = float(self.yard_usage) - original_yard_usage

                    # If using more yards, check if enough is available
                    if yard_difference > 0:
                        variant = self.fabric_variant
                        if yard_difference > float(variant.available_yard):
                            raise ValidationError("Not enough fabric available for additional usage.")

                        # Subtract the difference
                        variant.available_yard = float(variant.available_yard) - yard_difference
                        variant.save()

                    # If using fewer yards, add the difference back
                    elif yard_difference < 0:
                        variant = self.fabric_variant
                        variant.available_yard = float(variant.available_yard) - yard_difference  # Negative difference, so subtract
                        variant.save()

                # If nothing has changed that affects yard usage, just proceed

            except CuttingRecordFabric.DoesNotExist:
                # This shouldn't happen, but if it does, treat it as a new record
                is_update = False

        # Handle new record creation
        if not is_update:
            variant = self.fabric_variant
            # Use available_yard instead of total_yard
            current_available = float(variant.available_yard) if variant.available_yard is not None else float(variant.total_yard)
            if float(self.yard_usage) > current_available:
                raise ValidationError("Not enough fabric available. Cutting usage cannot exceed the remaining fabric.")
            variant.available_yard = current_available - float(self.yard_usage)
            variant.save()

        super().save(*args, **kwargs)