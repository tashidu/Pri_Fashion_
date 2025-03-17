from django.urls import path
from .views import (
    SupplierListCreateView,
    SupplierDetailView,
    FabricDefinitionListCreateView,
    FabricDefinitionDetailView,
    FabricVariantListCreateView,
    FabricVariantDetailView
)

urlpatterns = [
    # Supplier endpoints
    path('suppliers/', SupplierListCreateView.as_view(), name='supplier-list-create'),
    path('suppliers/<int:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),
    
    # Fabric Definition endpoints (shared information)
    path('fabric-definitions/', FabricDefinitionListCreateView.as_view(), name='fabric-definition-list-create'),
    path('fabric-definitions/<int:pk>/', FabricDefinitionDetailView.as_view(), name='fabric-definition-detail'),

    # Fabric Variant endpoints (unique information)
    path('fabric-variants/', FabricVariantListCreateView.as_view(), name='fabric-variant-list-create'),
    path('fabric-variants/<int:pk>/', FabricVariantDetailView.as_view(), name='fabric-variant-detail'),
]
