from django.urls import path, include
from rest_framework import routers
from .views import CuttingRecordViewSet, AddCuttingRecordView, CuttingRecordDetailView, FabricVariantCuttingHistoryView

router = routers.DefaultRouter()
router.register(r'cutting-records', CuttingRecordViewSet, basename='cutting-record')

urlpatterns = [
    # Custom endpoint for adding a cutting record
    path('addcuttingrecord/', AddCuttingRecordView.as_view(), name='add-cutting-record'),
    # Endpoint to get a specific cutting record by ID
    path('records/<int:pk>/', CuttingRecordDetailView.as_view(), name='cutting-record-detail'),
    # Endpoint to get cutting history for a specific fabric variant
    path('fabric-variant/<int:variant_id>/history/', FabricVariantCuttingHistoryView.as_view(), name='fabric-variant-cutting-history'),
    # Default router URLs for list, retrieve, update, delete, etc.
    path('', include(router.urls)),
]
