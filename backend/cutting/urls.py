from django.urls import path, include
from rest_framework import routers
from .views import CuttingRecordViewSet, AddCuttingRecordView

router = routers.DefaultRouter()
router.register(r'cutting-records', CuttingRecordViewSet, basename='cutting-record')

urlpatterns = [
    # Custom endpoint for adding a cutting record
    path('addcuttingrecord/', AddCuttingRecordView.as_view(), name='add-cutting-record'),
    # Default router URLs for list, retrieve, update, delete, etc.
    path('', include(router.urls)),
]
