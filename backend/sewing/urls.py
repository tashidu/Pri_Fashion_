# sewing/urls.py
from django.urls import path
from .views import AddDailySewingRecordView , ProductListAPIView


urlpatterns = [
    path('daily-records/', AddDailySewingRecordView.as_view(), name='add-daily-sewing-record'),
    path('product-list/', ProductListAPIView.as_view(), name='product-list'),
]
