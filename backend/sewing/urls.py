# sewing/urls.py
from django.urls import path
from .views import AddDailySewingRecordView

urlpatterns = [
    path('daily-records/', AddDailySewingRecordView.as_view(), name='add-daily-sewing-record'),
]
