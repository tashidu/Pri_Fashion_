from django.db import models

class Supplier(models.Model):
    supplier_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    address = models.TextField()
    tel_no = models.CharField(max_length=15)

    def __str__(self):
        return self.name

class Fabric(models.Model):
    name = models.CharField(max_length=100)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="fabrics")
    date_added = models.DateTimeField(auto_now_add=True)
    color = models.CharField(max_length=50)
    total_yard = models.FloatField()

    def __str__(self):
        return self.name
