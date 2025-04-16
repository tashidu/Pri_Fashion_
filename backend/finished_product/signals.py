from django.db.models.signals import post_save
from django.dispatch import receiver
from sewing.models import DailySewingRecord
from packing.models import PackingSession
from finished_product.models import FinishedProduct

@receiver(post_save, sender=DailySewingRecord)
def update_sewing_totals_on_save(sender, instance, **kwargs):
    if instance.cutting_record and hasattr(instance.cutting_record, 'finished_product'):
        instance.cutting_record.finished_product.update_totals()

@receiver(post_save, sender=PackingSession)
def update_packing_quantity_on_save(sender, instance, **kwargs):
    if instance.finished_product:
        instance.finished_product.recalculate_available_quantity()
