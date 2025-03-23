from rest_framework import viewsets
from .models import CuttingRecord
from .serializers import CuttingRecordSerializer
from rest_framework.permissions import AllowAny

from rest_framework.views import APIView
from rest_framework.response import Response




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