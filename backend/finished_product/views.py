# finished_product/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from finished_product.serializers import FinishedProductApprovalSerializer

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
