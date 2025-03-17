from django.urls import path
from .views import SupplierListCreateView, SupplierDetailView, FabricListCreateView, FabricDetailView

urlpatterns = [
    path('addsuppliers/', SupplierListCreateView.as_view(), name='supplier-list-create'),
    path('addfabrics/', FabricListCreateView.as_view(), name='fabric-list-create'),
    path('supplier/<int:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),
    path('fabric/<int:pk>/', FabricDetailView.as_view(), name='fabric-detail'),
    path('viewfabric/', FabricListCreateView.as_view(), name='fabric-list-create'),
     path('viewsuppliers/', SupplierListCreateView.as_view(), name='supplier-list-view'),
]
