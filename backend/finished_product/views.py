# finished_product/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework import status
from finished_product.serializers import FinishedProductApprovalSerializer
from finished_product.models import FinishedProduct
from finished_product.serializers import FinishedProductReportSerializer

class ApproveFinishedProductView(APIView):
    """
    Owner approval endpoint: Allows provisional approval of a finished product.
    """
    def post(self, request, format=None):
        serializer = FinishedProductApprovalSerializer(data=request.data)
        if serializer.is_valid():
            finished_product = serializer.save()
            return Response({
                "message": "Product approved provisionally.",
                "finished_product_id": finished_product.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FinishedProductReportView(ListAPIView):
    queryset = FinishedProduct.objects.all()
    serializer_class = FinishedProductReportSerializer

class UpdateFinishedProductView(APIView):
    """
    This view updates an existing FinishedProduct record. It re-aggregates the daily sewing totals,
    so the total product quantity can change. If new manufacturing or selling prices are provided,
    they are updated; otherwise, the prices remain unchanged.
    """
    def patch(self, request, pk, format=None):
        try:
            finished_product = FinishedProduct.objects.get(pk=pk)
        except FinishedProduct.DoesNotExist:
            return Response({"error": "Finished product not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Update prices only if provided in the request data.
        if "manufacture_price" in request.data:
            finished_product.manufacture_price = request.data["manufacture_price"]
        if "selling_price" in request.data:
            finished_product.selling_price = request.data["selling_price"]
        
        # Re-aggregate totals from the current sewing records.
        finished_product.update_totals()
        
        finished_product.save()
        return Response({"message": "Finished product updated successfully."}, status=status.HTTP_200_OK)