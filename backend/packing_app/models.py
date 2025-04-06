from django.db import models
from finished_product.models import FinishedProduct
from datetime import date

class PackingSession(models.Model):
    """
    Records individual packing sessions.
    """
    finished_product = models.ForeignKey(FinishedProduct, on_delete=models.CASCADE)
    date = models.DateField(default=date.today)
    number_of_6_packs = models.PositiveIntegerField(default=0)
    number_of_12_packs = models.PositiveIntegerField(default=0)
    extra_items = models.PositiveIntegerField(default=0)

    @property
    def total_packed_quantity(self):
        return self.number_of_6_packs * 6 + self.number_of_12_packs * 12 + self.extra_items

    def __str__(self):
        return f"Packing on {self.date} - {self.finished_product.name}"


class PackingInventory(models.Model):
    """
    Tracks current stock available for each finished product.
    Updates based on PackingSession and Order deliveries.
    """
    finished_product = models.OneToOneField(FinishedProduct, on_delete=models.CASCADE)
    number_of_6_packs = models.PositiveIntegerField(default=0)
    number_of_12_packs = models.PositiveIntegerField(default=0)
    extra_items = models.PositiveIntegerField(default=0)

    @property
    def total_quantity(self):
        return self.number_of_6_packs * 6 + self.number_of_12_packs * 12 + self.extra_items

    def update_from_session(self, session: PackingSession):
        self.number_of_6_packs += session.number_of_6_packs
        self.number_of_12_packs += session.number_of_12_packs
        self.extra_items += session.extra_items
        self.save()

    def deduct_for_order(self, six_packs, twelve_packs, extras):
        self.number_of_6_packs -= six_packs
        self.number_of_12_packs -= twelve_packs
        self.extra_items -= extras
        self.save()

    def __str__(self):
        return f"Packing Inventory - {self.finished_product.name}"
