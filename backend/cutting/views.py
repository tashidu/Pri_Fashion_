from rest_framework import viewsets, status
from .models import CuttingRecord
from .serializers import CuttingRecordSerializer
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404



class CuttingRecordViewSet(viewsets.ModelViewSet):
    queryset = CuttingRecord.objects.all()
    serializer_class = CuttingRecordSerializer
    permission_classes = [AllowAny]

class AddCuttingRecordView(APIView):
    def post(self, request, format=None):
        serializer = CuttingRecordSerializer(data=request.data)
        if serializer.is_valid():
            cutting_record = serializer.save()
            return Response(CuttingRecordSerializer(cutting_record).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CuttingRecordDetailView(APIView):
    """
    Retrieve a specific cutting record by ID with all its details.
    """
    def get(self, request, pk, format=None):
        try:
            cutting_record = get_object_or_404(CuttingRecord, pk=pk)
            serializer = CuttingRecordSerializer(cutting_record)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": f"Failed to retrieve cutting record: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )