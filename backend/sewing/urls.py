# sewing/urls.py
from django.urls import path
from .views import DailySewingRecordListCreateView

urlpatterns = [
    path('daily-records/', DailySewingRecordListCreateView.as_view(), name='daily-sewing-records'),
]
