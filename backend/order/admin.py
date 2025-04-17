from django.contrib import admin
from .models import Shop, Order, OrderItem

admin.site.register(Shop)
admin.site.register(Order)
admin.site.register(OrderItem)
