from django.db import models
from django.utils import timezone
from cutting.models import CuttingRecordFabric  # Import from your cutting app

class DailySewingRecord(models.Model):
    # Reference the CuttingRecordFabric detail rather than a FabricVariant directly.
    cutting_detail = models.ForeignKey(
        CuttingRecordFabric, 
        on_delete=models.CASCADE, 
        related_name='daily_sewing_records'
    )
    date = models.DateField(auto_now_add=True)
    xs = models.IntegerField(default=0)
    s = models.IntegerField(default=0)
    m = models.IntegerField(default=0)
    l = models.IntegerField(default=0)
    xl = models.IntegerField(default=0)
    damage_count = models.IntegerField(default=0)

    def __str__(self):
        return f"Sewing record for {self.cutting_detail} on {self.date}"
