# sewing/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import DailySewingRecord, FinishedProduct

@receiver(post_save, sender=DailySewingRecord)
def update_finished_product_on_save(sender, instance, created, **kwargs):
    variant = instance.fabric_variant
    # Get or create the FinishedProduct for this FabricVariant
    finished, created_fp = FinishedProduct.objects.get_or_create(fabric_variant=variant)
    finished.update_totals()

@receiver(post_delete, sender=DailySewingRecord)
def update_finished_product_on_delete(sender, instance, **kwargs):
    variant = instance.fabric_variant
    try:
        finished = FinishedProduct.objects.get(fabric_variant=variant)
        finished.update_totals()
    except FinishedProduct.DoesNotExist:
        # If no FinishedProduct exists, nothing to update.
        pass
