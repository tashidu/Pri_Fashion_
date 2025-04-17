# reports/urls.py
from django.urls import path
from .views import ProductPackingReportView

urlpatterns = [
    path('product-packing-report/', ProductPackingReportView.as_view(), name='product-packing-report'),
]
