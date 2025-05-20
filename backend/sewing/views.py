# sewing/views.py
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from .serializers import DailySewingRecordSerializer, DailySewingRecordHistorySerializer
from cutting.models import CuttingRecord, CuttingRecordFabric
from django.db.models import Sum, Max
from sewing.models import DailySewingRecord
from datetime import date


class AddDailySewingRecordView(APIView):
    """
    View to add a daily sewing record.
    """
    def post(self, request, format=None):
        serializer = DailySewingRecordSerializer(data=request.data)
        if serializer.is_valid():
            record = serializer.save()
            return Response(DailySewingRecordSerializer(record).data, status=status.HTTP_201_CREATED)
        else:
            print(serializer.errors)  # Log errors to the console (better error logging can be added)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductListAPIView(APIView):
    """
    Returns a list of products (cutting batches) with aggregated sewing data.
    """
    def get(self, request, format=None):
        data = []
        # Get all cutting records (each is a product)
        products = CuttingRecord.objects.all()

        for product in products:
            # Aggregate cutting data from CuttingRecordFabric details for this product
            cutting_agg = product.details.aggregate(
                xs_sum=Sum('xs'),
                s_sum=Sum('s'),
                m_sum=Sum('m'),
                l_sum=Sum('l'),
                xl_sum=Sum('xl')
            )
            total_cut = sum([cutting_agg.get('xs_sum') or 0,
                             cutting_agg.get('s_sum') or 0,
                             cutting_agg.get('m_sum') or 0,
                             cutting_agg.get('l_sum') or 0,
                             cutting_agg.get('xl_sum') or 0])

            # Aggregate sewing records for all details belonging to this product
            sewing_qs = DailySewingRecord.objects.filter(cutting_record_fabric__cutting_record=product)
            sewing_agg = sewing_qs.aggregate(
                xs_sum=Sum('xs'),
                s_sum=Sum('s'),
                m_sum=Sum('m'),
                l_sum=Sum('l'),
                xl_sum=Sum('xl'),
                damage_sum=Sum('damage_count'),
                last_update=Max('date')
            )
            total_sewn = sum([sewing_agg.get('xs_sum') or 0,
                              sewing_agg.get('s_sum') or 0,
                              sewing_agg.get('m_sum') or 0,
                              sewing_agg.get('l_sum') or 0,
                              sewing_agg.get('xl_sum') or 0])

            remaining = total_cut - total_sewn

            # For each color (CuttingRecordFabric detail), get sewing aggregates
            color_details = []
            for detail in product.details.all():
                sewing_for_detail = DailySewingRecord.objects.filter(cutting_record_fabric=detail)

                agg_detail = sewing_for_detail.aggregate(
                    xs=Sum('xs'),
                    s=Sum('s'),
                    m=Sum('m'),
                    l=Sum('l'),
                    xl=Sum('xl'),
                    damage=Sum('damage_count')
                )
                total_for_detail = sum([agg_detail.get('xs') or 0,
                                        agg_detail.get('s') or 0,
                                        agg_detail.get('m') or 0,
                                        agg_detail.get('l') or 0,
                                        agg_detail.get('xl') or 0])

                color_details.append({
                    'cutting_detail_id': detail.id,
                    'color': str(detail.fabric_variant),  # assuming your fabric_variant has a readable __str__
                    'xs': agg_detail.get('xs') or 0,
                    's': agg_detail.get('s') or 0,
                    'm': agg_detail.get('m') or 0,
                    'l': agg_detail.get('l') or 0,
                    'xl': agg_detail.get('xl') or 0,
                    'damage_count': agg_detail.get('damage') or 0,
                    'total_sewn': total_for_detail,
                })

            # Get total damage count
            total_damage = sewing_agg.get('damage_sum') or 0

            # Append data for this product
            data.append({
                'id': product.id,
                'product_name': product.product_name or f"{product.fabric_definition.fabric_name} cut on {product.cutting_date}",
                'last_update_date': sewing_agg.get('last_update'),
                'total_cut': total_cut,
                'total_sewn': total_sewn,
                'total_damage': total_damage,
                'remaining': remaining,
                'color_details': color_details
            })

        return Response(data, status=status.HTTP_200_OK)


class DailySewingHistoryListAPIView(generics.ListAPIView):
    """
    Returns a list of all daily sewing records with history, ordered by date.
    """
    queryset = DailySewingRecord.objects.all().order_by('-date')
    serializer_class = DailySewingRecordHistorySerializer


class AlreadySewnQuantitiesView(APIView):
    """
    Returns the already sewn quantities for a specific cutting record fabric.
    """
    def get(self, request, cutting_record_fabric_id):
        try:
            # Get the cutting record fabric
            cutting_record_fabric = CuttingRecordFabric.objects.get(id=cutting_record_fabric_id)

            # Get all sewing records for this cutting record fabric
            sewing_records = DailySewingRecord.objects.filter(cutting_record_fabric=cutting_record_fabric)

            # Aggregate the quantities
            aggregates = sewing_records.aggregate(
                xs_sum=Sum('xs'),
                s_sum=Sum('s'),
                m_sum=Sum('m'),
                l_sum=Sum('l'),
                xl_sum=Sum('xl'),
                damage_sum=Sum('damage_count')
            )

            # Prepare the response
            response_data = {
                'xs': aggregates.get('xs_sum') or 0,
                's': aggregates.get('s_sum') or 0,
                'm': aggregates.get('m_sum') or 0,
                'l': aggregates.get('l_sum') or 0,
                'xl': aggregates.get('xl_sum') or 0,
                'damage_count': aggregates.get('damage_sum') or 0
            }

            return Response(response_data)
        except CuttingRecordFabric.DoesNotExist:
            return Response(
                {"error": "Cutting record fabric not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class TodaySewingCountView(APIView):
    """
    Returns the total sewing count for today.
    """
    def get(self, request, format=None):
        try:
            # Get today's date
            today = date.today()

            # Get all sewing records for today
            today_records = DailySewingRecord.objects.filter(date=today)

            # Aggregate the quantities
            aggregates = today_records.aggregate(
                xs_sum=Sum('xs'),
                s_sum=Sum('s'),
                m_sum=Sum('m'),
                l_sum=Sum('l'),
                xl_sum=Sum('xl')
            )

            # Calculate total sewn today
            total_sewn_today = sum([
                aggregates.get('xs_sum') or 0,
                aggregates.get('s_sum') or 0,
                aggregates.get('m_sum') or 0,
                aggregates.get('l_sum') or 0,
                aggregates.get('xl_sum') or 0
            ])

            # Prepare the response
            response_data = {
                'total_sewn_today': total_sewn_today,
                'xs': aggregates.get('xs_sum') or 0,
                's': aggregates.get('s_sum') or 0,
                'm': aggregates.get('m_sum') or 0,
                'l': aggregates.get('l_sum') or 0,
                'xl': aggregates.get('xl_sum') or 0
            }

            return Response(response_data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
