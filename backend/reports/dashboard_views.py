from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Sum, F, Q, Value
from django.db.models.functions import Coalesce
from fabric.models import FabricDefinition, FabricVariant, Supplier
from cutting.models import CuttingRecord, CuttingRecordFabric
from sewing.models import DailySewingRecord
from packing_app.models import PackingSession
from datetime import datetime, timedelta

class DashboardStatsView(APIView):
    """
    API endpoint that returns statistics for the inventory dashboard.
    """
    def get(self, request, format=None):
        try:
            # Count various inventory items
            fabric_count = FabricDefinition.objects.count()
            fabric_variant_count = FabricVariant.objects.count()
            cutting_count = CuttingRecord.objects.count()
            sewing_count = DailySewingRecord.objects.count()
            packing_count = PackingSession.objects.count()
            supplier_count = Supplier.objects.count()

            # Get low stock items (fabrics with available_yard < 20% of total_yard)
            low_stock_fabrics = FabricVariant.objects.filter(
                available_yard__lt=F('total_yard') * 0.2
            ).count()

            # Return all statistics
            return Response({
                'fabric_count': fabric_count,
                'fabric_variant_count': fabric_variant_count,
                'cutting_count': cutting_count,
                'sewing_count': sewing_count,
                'packing_count': packing_count,
                'supplier_count': supplier_count,
                'low_stock_count': low_stock_fabrics
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RecentActivityView(APIView):
    """
    API endpoint that returns recent activity for the inventory dashboard.
    """
    def get(self, request, format=None):
        try:
            # Get recent activities (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)

            # Recent fabric additions
            recent_fabrics = []
            for fabric in FabricVariant.objects.filter(fabric_definition__date_added__gte=thirty_days_ago).order_by('-fabric_definition__date_added')[:5]:
                recent_fabrics.append({
                    'id': fabric.id,
                    'type': 'fabric',
                    'action': 'added',
                    'item': f"{fabric.fabric_definition.fabric_name} - {fabric.color_name}",
                    'date': fabric.fabric_definition.date_added.strftime('%Y-%m-%d'),
                    'user': 'System'  # Replace with actual user when authentication is implemented
                })

            # Recent cutting records
            recent_cutting = []
            for cutting in CuttingRecord.objects.order_by('-cutting_date')[:5]:
                recent_cutting.append({
                    'id': cutting.id,
                    'type': 'cutting',
                    'action': 'created',
                    'item': cutting.product_name or f"Cutting #{cutting.id}",
                    'date': cutting.cutting_date.strftime('%Y-%m-%d'),
                    'user': 'System'  # Replace with actual user when authentication is implemented
                })

            # Recent sewing records
            recent_sewing = []
            for sewing in DailySewingRecord.objects.order_by('-date')[:5]:
                product_name = "Unknown"
                try:
                    product_name = sewing.cutting_record_fabric.cutting_record.product_name or f"Sewing #{sewing.id}"
                except:
                    pass

                recent_sewing.append({
                    'id': sewing.id,
                    'type': 'sewing',
                    'action': 'completed',
                    'item': product_name,
                    'date': sewing.date.strftime('%Y-%m-%d'),
                    'user': 'System'  # Replace with actual user when authentication is implemented
                })

            # Recent packing sessions
            recent_packing = []
            for packing in PackingSession.objects.order_by('-date')[:5]:
                recent_packing.append({
                    'id': packing.id,
                    'type': 'packing',
                    'action': 'packed',
                    'item': f"Packing #{packing.id}",
                    'date': packing.date.strftime('%Y-%m-%d'),
                    'user': 'System'  # Replace with actual user when authentication is implemented
                })

            # Combine all activities and sort by date (newest first)
            all_activities = recent_fabrics + recent_cutting + recent_sewing + recent_packing
            all_activities.sort(key=lambda x: x['date'], reverse=True)

            return Response(all_activities[:10], status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LowStockItemsView(APIView):
    """
    API endpoint that returns low stock items for the inventory dashboard.
    """
    def get(self, request, format=None):
        try:
            # Get fabrics with low stock (available_yard < 20% of total_yard)
            low_stock_fabrics = FabricVariant.objects.filter(
                available_yard__lt=F('total_yard') * 0.2
            ).select_related('fabric_definition')

            low_stock_items = []
            for fabric in low_stock_fabrics:
                low_stock_items.append({
                    'id': fabric.id,
                    'name': f"{fabric.fabric_definition.fabric_name} - {fabric.color_name}",
                    'type': 'fabric',
                    'current': fabric.available_yard,
                    'threshold': fabric.total_yard * 0.2,
                    'supplier': fabric.fabric_definition.supplier.name
                })

            return Response(low_stock_items, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductionTrendsView(APIView):
    """
    API endpoint that returns production trends for the inventory dashboard.
    """
    def get(self, request, format=None):
        try:
            # Get production trends for the last 6 months
            today = datetime.now()
            months = []

            for i in range(5, -1, -1):
                month_date = today - timedelta(days=30 * i)
                month_name = month_date.strftime('%b')
                month_start = datetime(month_date.year, month_date.month, 1)

                if month_date.month == 12:
                    month_end = datetime(month_date.year + 1, 1, 1) - timedelta(days=1)
                else:
                    month_end = datetime(month_date.year, month_date.month + 1, 1) - timedelta(days=1)

                # Fabric usage (total yards used in cutting)
                # Sum yard_usage from all CuttingRecordFabric entries for CuttingRecords in this period
                fabric_usage = CuttingRecord.objects.filter(
                    cutting_date__gte=month_start,
                    cutting_date__lte=month_end
                ).aggregate(
                    total_yards=Sum('details__yard_usage')
                )['total_yards'] or 0

                # Cutting records count
                cutting_records = CuttingRecord.objects.filter(
                    cutting_date__gte=month_start,
                    cutting_date__lte=month_end
                ).count()

                months.append({
                    'name': month_name,
                    'fabricUsage': fabric_usage,
                    'cuttingRecords': cutting_records
                })

            return Response(months, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ColorAnalysisView(APIView):
    """
    API endpoint that returns analysis of most used fabric colors.
    """
    def get(self, request, format=None):
        try:
            # Get the most used fabric colors in cutting records
            # We need to join CuttingRecordFabric with FabricVariant to get color information
            color_analysis = CuttingRecordFabric.objects.values(
                'fabric_variant__color',
                'fabric_variant__color_name'
            ).annotate(
                count=Count('id'),
                total_yard_usage=Sum('yard_usage')
            ).order_by('-count')[:5]

            # Format the response
            result = []
            for item in color_analysis:
                result.append({
                    'colorCode': item['fabric_variant__color'],
                    'colorName': item['fabric_variant__color_name'] or 'Unknown',
                    'count': item['count'],
                    'yardUsage': float(item['total_yard_usage'])
                })

            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FabricStockView(APIView):
    """
    API endpoint that returns remaining fabric stock with yard amounts and costs.
    """
    def get(self, request, format=None):
        try:
            # Get fabrics with available yards and price information
            fabrics = FabricVariant.objects.filter(
                available_yard__gt=0
            ).select_related('fabric_definition').order_by('-available_yard')[:5]

            # Format the response
            result = []
            for fabric in fabrics:
                result.append({
                    'id': fabric.id,
                    'name': f"{fabric.fabric_definition.fabric_name} - {fabric.color_name}",
                    'colorCode': fabric.color,
                    'availableYards': float(fabric.available_yard),
                    'pricePerYard': float(fabric.price_per_yard)
                })

            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
