from rest_framework import generics
from .models import Supplier, FabricDefinition, FabricVariant
from .serializers import (
    SupplierSerializer,
    FabricDefinitionSerializer,
    FabricVariantSerializer,
    FabricDefinitionDetailSerializer
)

# ----- Supplier Endpoints -----
class SupplierListCreateView(generics.ListCreateAPIView):
    """
    GET: List all suppliers.
    POST: Create a new supplier.
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET, PUT/PATCH, DELETE a specific supplier.
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

# ----- Fabric Definition Endpoints -----
# FabricDefinition stores the shared data: fabric_name, supplier, date_added
class FabricDefinitionListCreateView(generics.ListCreateAPIView):
    """
    GET: List all fabric definitions.
    POST: Create a new fabric definition.
    """
    queryset = FabricDefinition.objects.all()
    serializer_class = FabricDefinitionDetailSerializer

class FabricDefinitionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET, PUT/PATCH, DELETE a specific fabric definition.
    """
    queryset = FabricDefinition.objects.all()
    serializer_class = FabricDefinitionSerializer

# ----- Fabric Variant Endpoints -----
# FabricVariant stores the unique fields: color, total_yard, price_per_yard
class FabricVariantListCreateView(generics.ListCreateAPIView):
    """
    GET: List all fabric variants.
    POST: Create a new fabric variant.
    """
    queryset = FabricVariant.objects.all()
    serializer_class = FabricVariantSerializer

class FabricVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET, PUT/PATCH, DELETE a specific fabric variant.
    """
    queryset = FabricVariant.objects.all()
    serializer_class = FabricVariantSerializer

class FabricVariantByDefinitionListView(generics.ListAPIView):
    serializer_class = FabricVariantSerializer

    def get_queryset(self):
        definition_id = self.kwargs.get('definition_id')
        return FabricVariant.objects.filter(fabric_definition_id=definition_id)