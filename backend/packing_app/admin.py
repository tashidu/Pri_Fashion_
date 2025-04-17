from django.contrib import admin
from .models import PackingSession, PackingInventory

admin.site.register(PackingSession)
admin.site.register(PackingInventory)
