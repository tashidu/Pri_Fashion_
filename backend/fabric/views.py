from rest_framework import generics
from .models import Supplier, Fabric
from .serializers import SupplierSerializer, FabricSerializer

class SupplierListCreateView(generics.ListCreateAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

class FabricListCreateView(generics.ListCreateAPIView):
    queryset = Fabric.objects.all()
    serializer_class = FabricSerializer

class FabricDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Fabric.objects.all()
    serializer_class = FabricSerializer
