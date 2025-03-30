# sewing/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import DailySewingRecordSerializer

class AddDailySewingRecordView(APIView):
    def post(self, request, format=None):
        serializer = DailySewingRecordSerializer(data=request.data)
        if serializer.is_valid():
            record = serializer.save()
            return Response(DailySewingRecordSerializer(record).data, status=status.HTTP_201_CREATED)
        else:
            print(serializer.errors)  # Log errors to the console
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
