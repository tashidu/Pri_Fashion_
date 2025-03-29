from django.db import models
from fabric.models import FabricVariant  # ensure this is imported correctly
from django.db.models import Sum
from django.utils import timezone

class DailySewingRecord(models.Model):
    fabric_variant = models.ForeignKey(FabricVariant, on_delete=models.CASCADE, related_name='daily_sewing_records')
    date = models.DateField(auto_now_add=True)
    xs = models.IntegerField(default=0)
    s = models.IntegerField(default=0)
    m = models.IntegerField(default=0)
    l = models.IntegerField(default=0)
    xl = models.IntegerField(default=0)
    damage_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.fabric_variant} sewn on {self.date}"


class FinishedProduct(models.Model):
    fabric_variant = models.OneToOneField(FabricVariant, on_delete=models.CASCADE, related_name='finished_product')
    total_sewn_xs = models.IntegerField(default=0)
    total_sewn_s = models.IntegerField(default=0)
    total_sewn_m = models.IntegerField(default=0)
    total_sewn_l = models.IntegerField(default=0)
    total_sewn_xl = models.IntegerField(default=0)
    damage_count = models.IntegerField(default=0)
    last_update_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, default='In Progress') 
    # e.g., "In Progress" or "Finished"

    def __str__(self):
        return f"Finished product for {self.fabric_variant}"

    def update_totals(self):
        """
        Aggregates all DailySewingRecord entries for this fabric_variant.
        Updates the total sewn counts, damage count, last update date, and status.
        """
        aggregates = self.fabric_variant.daily_sewing_records.aggregate(
            xs_sum=Sum('xs'),
            s_sum=Sum('s'),
            m_sum=Sum('m'),
            l_sum=Sum('l'),
            xl_sum=Sum('xl'),
            damage_sum=Sum('damage_count')
        )
        self.total_sewn_xs = aggregates['xs_sum'] or 0
        self.total_sewn_s = aggregates['s_sum'] or 0
        self.total_sewn_m = aggregates['m_sum'] or 0
        self.total_sewn_l = aggregates['l_sum'] or 0
        self.total_sewn_xl = aggregates['xl_sum'] or 0
        self.damage_count = aggregates['damage_sum'] or 0
        self.last_update_date = timezone.now()

        # Example business rule: mark as Finished if total sewn is greater than zero
        total_sewn = (
            self.total_sewn_xs +
            self.total_sewn_s +
            self.total_sewn_m +
            self.total_sewn_l +
            self.total_sewn_xl
        )
        self.status = "Finished" if total_sewn > 0 else "In Progress"
        self.save()
