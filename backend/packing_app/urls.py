# packing/urls.py
from django.urls import path
from .views import (
    PackingSessionCreateView,
    PackingSessionListView,
    PackingInventoryListView,
    ProductPackingSessionsView
)

urlpatterns = [
    path('sessions/', PackingSessionCreateView.as_view(), name='add-packing-session'),
    path('sessions/history/', PackingSessionListView.as_view(), name='packing-session-history'),
    path('inventory/', PackingInventoryListView.as_view(), name='packing-inventory'),
    path('product/<int:product_id>/sessions/', ProductPackingSessionsView.as_view(), name='product-packing-sessions'),
]
