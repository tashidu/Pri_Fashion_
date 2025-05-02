# sewing/urls.py
from django.urls import path
from .views import (
    AddDailySewingRecordView,
    ProductListAPIView,
    DailySewingHistoryListAPIView,
    AlreadySewnQuantitiesView
)

urlpatterns = [
    path('daily-records/', AddDailySewingRecordView.as_view(), name='add-daily-sewing-record'),
    path('product-list/', ProductListAPIView.as_view(), name='product-list'),
    path('history/daily/', DailySewingHistoryListAPIView.as_view(), name='daily-sewing-history'),
    path('already-sewn/<int:cutting_record_fabric_id>/', AlreadySewnQuantitiesView.as_view(), name='already-sewn-quantities'),
]
