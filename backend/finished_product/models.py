# finished_product/models.py
from django.db import models
from django.utils import timezone
from cutting.models import CuttingRecord

class FinishedProduct(models.Model):
    # Link to the cutting record (batch) for which sewing is being approved.
    cutting_record = models.OneToOneField(
        CuttingRecord, on_delete=models.CASCADE, related_name='finished_product'
    )
    # Aggregated sewn quantities from daily sewing records.
    total_sewn_xs = models.IntegerField(default=0)
    total_sewn_s = models.IntegerField(default=0)
    total_sewn_m = models.IntegerField(default=0)
    total_sewn_l = models.IntegerField(default=0)
    total_sewn_xl = models.IntegerField(default=0)
    # Prices set by the owner upon provisional approval.
    manufacture_price = models.FloatField(null=True, blank=True)
    selling_price = models.FloatField(null=True, blank=True)
    # Date of provisional approval.
    approval_date = models.DateField(default=timezone.now)
    # Flag to indicate if the product is still provisional.
    is_provisional = models.BooleanField(default=True)

    def __str__(self):
        return f"Finished Product for {self.cutting_record}"

    def update_totals(self):
        """
        Aggregate sewing quantities from related DailySewingRecord entries.
        Assumes that CuttingRecord has a reverse relation 'details' to CuttingRecordFabric,
        and each CuttingRecordFabric has a related name 'daily_sewing_records'.
        """
        from django.db.models import Sum

        aggregates = self.cutting_record.details.all().aggregate(
            xs_sum=Sum('daily_sewing_records__xs'),
            s_sum=Sum('daily_sewing_records__s'),
            m_sum=Sum('daily_sewing_records__m'),
            l_sum=Sum('daily_sewing_records__l'),
            xl_sum=Sum('daily_sewing_records__xl')
        )
        self.total_sewn_xs = aggregates.get('xs_sum') or 0
        self.total_sewn_s = aggregates.get('s_sum') or 0
        self.total_sewn_m = aggregates.get('m_sum') or 0
        self.total_sewn_l = aggregates.get('l_sum') or 0
        self.total_sewn_xl = aggregates.get('xl_sum') or 0
        self.save()
