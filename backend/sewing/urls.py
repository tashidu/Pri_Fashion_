# sewing/urls.py
from django.urls import path
from .views import DailySewingRecordListCreateView, DailySewingRecordListView

urlpatterns = [
    path('daily-records/', DailySewingRecordListCreateView.as_view(), name='daily-sewing-records'),
    path('daily-records/history/', DailySewingRecordListView.as_view(), name='daily-sewing-history'),
]
