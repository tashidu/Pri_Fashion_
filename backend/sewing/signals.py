from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum
from .models import DailySewingRecord
from finished_product.models import FinishedProduct  # Ensure this is the correct model

@receiver(post_save, sender=DailySewingRecord)
def update_approved_finished_product(sender, instance, **kwargs):
    # Get the cutting record (batch) from the DailySewingRecord's cutting_detail
    batch = instance.cutting_detail.cutting_record
    
    try:
        # Try to get the related FinishedProduct (this might need to be ApprovedFinishedProduct if that's correct)
        approved_product = FinishedProduct.objects.get(cutting_record=batch)
    except FinishedProduct.DoesNotExist:
        # Skip if no FinishedProduct is found for this batch (i.e., not yet approved)
        return

    # Aggregate the sewing records for this batch
    sewing_qs = DailySewingRecord.objects.filter(cutting_detail__cutting_record=batch)
    sewing_agg = sewing_qs.aggregate(
        xs_sum=Sum('xs'),
        s_sum=Sum('s'),
        m_sum=Sum('m'),
        l_sum=Sum('l'),
        xl_sum=Sum('xl')
    )

    # Update the totals in the FinishedProduct model based on the aggregated values
    approved_product.total_sewn_xs = sewing_agg['xs_sum'] or 0
    approved_product.total_sewn_s = sewing_agg['s_sum'] or 0
    approved_product.total_sewn_m = sewing_agg['m_sum'] or 0
    approved_product.total_sewn_l = sewing_agg['l_sum'] or 0
    approved_product.total_sewn_xl = sewing_agg['xl_sum'] or 0
    
    # Save the updated FinishedProduct record
    approved_product.save()
