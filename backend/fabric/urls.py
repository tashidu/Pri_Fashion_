from django.urls import path
from .views import SupplierListCreateView, SupplierDetailView, FabricListCreateView, FabricDetailView

urlpatterns = [
     path('suppliers/', SupplierListCreateView.as_view(), name='supplier-list-create'),
     path('viewsuppliers/', SupplierListCreateView.as_view(), name='supplier-list-create'),
     path('addfabrics/', FabricListCreateView.as_view(), name='fabric-list-create'),
    path('supplier/<int:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),
    path('fabric/', FabricListCreateView.as_view(), name='fabric-list'),
    path('fabric/<int:pk>/', FabricDetailView.as_view(), name='fabric-detail'),
]
