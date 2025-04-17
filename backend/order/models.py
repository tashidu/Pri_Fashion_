# order/models.py
from django.db import models
from django.contrib.auth.models import User
from finished_product.models import FinishedProduct
from django.conf import settings


class Shop(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    contact_number = models.CharField(max_length=20)

    def __str__(self):
        return self.name

class Order(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('invoiced', 'Invoiced'),
        ('delivered', 'Delivered'),
    ]

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    placed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approval_date = models.DateTimeField(null=True, blank=True)
    invoice_number = models.CharField(max_length=50, blank=True)

    @property
    def total_amount(self):
        return sum(item.subtotal for item in self.items.all())


    def __str__(self):
        return f"Order #{self.id} - {self.shop.name}"
class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    finished_product = models.ForeignKey(FinishedProduct, on_delete=models.PROTECT)
    quantity_6_packs = models.PositiveIntegerField(default=0)
    quantity_12_packs = models.PositiveIntegerField(default=0)
    quantity_extra_items = models.PositiveIntegerField(default=0)

    @property
    def subtotal(self):
        unit_price = self.finished_product.selling_price or 0
        total_units = self.total_units  # Calculate total units
        return total_units * unit_price

    def __str__(self):
        return f"{self.finished_product} x {self.total_units} units"

    @property
    def total_units(self):
        return self.quantity_6_packs * 6 + self.quantity_12_packs * 12 + self.quantity_extra_items
