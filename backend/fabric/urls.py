from django.urls import path
from .views import SupplierListCreateView, SupplierDetailView, FabricListCreateView, FabricDetailView

urlpatterns = [
    path('supplier/', SupplierListCreateView.as_view(), name='supplier-list'),
    path('supplier/<int:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),
    path('fabric/', FabricListCreateView.as_view(), name='fabric-list'),
    path('fabric/<int:pk>/', FabricDetailView.as_view(), name='fabric-detail'),
]
