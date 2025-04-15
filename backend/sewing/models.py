from django.db import models
from cutting.models import CuttingRecordFabric  # Import from your cutting app

class DailySewingRecord(models.Model):
    # Renamed ForeignKey field to _cuttingrecordfabric
    cutting_record_fabric = models.ForeignKey(
    'cutting.CuttingRecordFabric',
    db_column='cutting_record_fabric_id',
    on_delete=models.CASCADE
)


    date = models.DateField(auto_now_add=True)
    xs = models.IntegerField(default=0)
    s = models.IntegerField(default=0)
    m = models.IntegerField(default=0)
    l = models.IntegerField(default=0)
    xl = models.IntegerField(default=0)
    damage_count = models.IntegerField(default=0)

    def __str__(self):
        return f"Sewing record for {self.cuttingrecordfabric} on {self.date}"
