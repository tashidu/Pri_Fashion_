from django.db import models
from cutting.models import CuttingRecordFabric  # Import from your cutting app

class DailySewingRecord(models.Model):
    # Renamed ForeignKey field to _cuttingrecordfabric
    _cuttingrecordfabric = models.ForeignKey(
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
        return f"Sewing record for {self._cuttingrecordfabric} on {self.date}"
