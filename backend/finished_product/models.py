# finished_product/models.py

from django.db import models
from django.utils import timezone
from django.db.models import Sum, F
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

    # Available quantity (stored field)
    available_quantity = models.IntegerField(default=0)

    # Product image (legacy field, kept for backward compatibility)
    product_image = models.ImageField(upload_to='product_images/', null=True, blank=True)

    # Notes about the product
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Finished Product for {self.cutting_record}"

    @property
    def product_images(self):
        """
        Returns a list of all image URLs for this product.
        If no ProductImage instances exist, falls back to the legacy product_image field.
        """
        images = list(self.images.all().values_list('image', flat=True))
        if not images and self.product_image:
            images = [self.product_image]
        return images

    def update_totals(self):
        """
        Aggregate sewing quantities from related DailySewingRecord entries.
        Assumes that CuttingRecord has a reverse relation 'details' to CuttingRecordFabric,
        and each CuttingRecordFabric has a related name 'daily_sewing_records'.
        """
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

        self.recalculate_available_quantity()  # ➕ CALL THIS HERE!

        self.save()

    def recalculate_available_quantity(self):
        """
        Updates the available_quantity field as:
        total_sewn - total_packed
        """
        total_sewn = (
            self.total_sewn_xs +
            self.total_sewn_s +
            self.total_sewn_m +
            self.total_sewn_l +
            self.total_sewn_xl
        )

        total_packed = self.packing_sessions.aggregate(
            total=Sum(
                F('number_of_6_packs') * 6 +
                F('number_of_12_packs') * 12 +
                F('extra_items')
            )
        )['total'] or 0

        self.available_quantity = total_sewn - total_packed
        self.save()


class ProductImage(models.Model):
    """
    Model to store multiple images for a finished product.
    Images can be stored either as uploaded files or as external URLs (e.g., from Firebase).
    """
    finished_product = models.ForeignKey(FinishedProduct, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    external_url = models.URLField(max_length=500, null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Image {self.order} for {self.finished_product}"

    @property
    def url(self):
        """
        Returns the URL of the image, whether it's an uploaded file or an external URL.
        """
        if self.external_url:
            return self.external_url
        elif self.image:
            return self.image.url
        return None
