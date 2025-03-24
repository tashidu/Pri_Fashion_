from rest_framework import generics
from .models import DailySewingRecord
from .serializers import DailySewingRecordSerializer

class DailySewingRecordListCreateView(generics.ListCreateAPIView):
    queryset = DailySewingRecord.objects.all()  # Removed trailing comma here
    serializer_class = DailySewingRecordSerializer
