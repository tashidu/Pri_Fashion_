# reports/views.py
from rest_framework.generics import ListAPIView
from finished_product.models import FinishedProduct
from .serializers import ProductPackingReportSerializer

class ProductPackingReportView(ListAPIView):
    queryset = FinishedProduct.objects.all()
    serializer_class = ProductPackingReportSerializer
