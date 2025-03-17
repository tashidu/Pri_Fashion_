from django.db import models

class Supplier(models.Model):
    supplier_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    address = models.TextField()
    tel_no = models.CharField(max_length=15)

    def __str__(self):
        return self.name
    
class FabricDefinition(models.Model):
    """
    Stores the shared information for a 'fabric group':
      - Fabric name
      - Supplier
      - Date added
    """
    fabric_name = models.CharField(max_length=100)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    date_added = models.DateField()

    def __str__(self):
        return f"{self.fabric_name} ({self.date_added})"
    
class FabricVariant(models.Model):
    """
    Stores the unique fields for each fabric variation:
      - Color
      - Total yard
      - Price per yard
      - Links back to FabricDefinition
    """
    fabric_definition = models.ForeignKey(
        FabricDefinition,
        on_delete=models.CASCADE,
        related_name="variants"
    )
    color = models.CharField(max_length=50)
    total_yard = models.FloatField()
    price_per_yard = models.FloatField()

    def __str__(self):
        return f"{self.color} - {self.fabric_definition.fabric_name}"
