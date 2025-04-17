from django.db import models
from django.utils import timezone
from fabric.models import FabricDefinition, FabricVariant
from rest_framework.exceptions import ValidationError


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
        # Only perform the subtraction on creation.
        if not self.pk:
            variant = self.fabric_variant
            # Use available_yard instead of total_yard.
            # If available_yard is not set, initialize it to total_yard.
            current_available = float(variant.available_yard) if variant.available_yard is not None else float(variant.total_yard)
            if float(self.yard_usage) > current_available:
                raise ValidationError("Not enough fabric available. Cutting usage cannot exceed the remaining fabric.")
            variant.available_yard = current_available - float(self.yard_usage)
            variant.save()
        super().save(*args, **kwargs)