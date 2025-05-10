from rest_framework import viewsets, status
from .models import CuttingRecord, CuttingRecordFabric
from .serializers import CuttingRecordSerializer, CuttingRecordFabricSerializer
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from fabric.models import FabricVariant
from django.db.models import Sum



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

class FabricVariantCuttingHistoryView(APIView):
    """
    Retrieve cutting history for a specific fabric variant.
    """
    def get(self, request, variant_id, format=None):
        try:
            # Get the fabric variant
            fabric_variant = get_object_or_404(FabricVariant, pk=variant_id)

            # Get all cutting records that use this fabric variant
            cutting_records_fabric = CuttingRecordFabric.objects.filter(
                fabric_variant=fabric_variant
            ).select_related('cutting_record')

            # Prepare the response data
            result = []
            for record_fabric in cutting_records_fabric:
                cutting_record = record_fabric.cutting_record
                result.append({
                    'id': record_fabric.id,  # This is the CuttingRecordFabric ID
                    'cutting_record_id': cutting_record.id,  # This is the CuttingRecord ID for navigation
                    'product_name': cutting_record.product_name or f"Cutting on {cutting_record.cutting_date}",
                    'cutting_date': cutting_record.cutting_date,
                    'description': cutting_record.description,
                    'yard_usage': float(record_fabric.yard_usage),
                    'sizes': {
                        'xs': record_fabric.xs,
                        's': record_fabric.s,
                        'm': record_fabric.m,
                        'l': record_fabric.l,
                        'xl': record_fabric.xl
                    },
                    'total_pieces': record_fabric.xs + record_fabric.s + record_fabric.m + record_fabric.l + record_fabric.xl
                })

            # Get fabric variant details
            fabric_data = {
                'id': fabric_variant.id,
                'color': fabric_variant.color,
                'color_name': fabric_variant.color_name,
                'total_yard': float(fabric_variant.total_yard),
                'available_yard': float(fabric_variant.available_yard),
                'price_per_yard': float(fabric_variant.price_per_yard),
                'fabric_definition': {
                    'id': fabric_variant.fabric_definition.id,
                    'fabric_name': fabric_variant.fabric_definition.fabric_name,
                    'date_added': fabric_variant.fabric_definition.date_added
                },
                'cutting_history': result
            }

            return Response(fabric_data)
        except Exception as e:
            return Response(
                {"error": f"Failed to retrieve fabric variant cutting history: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )