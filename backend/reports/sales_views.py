from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models.functions import TruncMonth
from django.db.models import Sum, F, FloatField
from django.db.models.expressions import ExpressionWrapper
from order.models import Order, OrderItem
from finished_product.models import FinishedProduct
from datetime import datetime, timedelta

class SalesPerformanceView(APIView):
    """
    API endpoint that returns sales performance data for the owner dashboard.
    """
    def get(self, request, format=None):
        try:
            # Get time period from query params (default to last 6 months)
            months = int(request.query_params.get('months', 6))

            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30 * months)

            # Monthly sales trends - we need to calculate total_amount manually
            # First, get orders grouped by month
            monthly_orders = Order.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            ).annotate(
                month=TruncMonth('created_at')
            )

            # Group by month and calculate totals
            monthly_sales_data = []
            months_data = {}

            # Process each order
            for order in monthly_orders:
                month_key = order.month.strftime('%Y-%m')
                month_display = order.month.strftime('%b %Y')

                # Initialize month data if not exists
                if month_key not in months_data:
                    months_data[month_key] = {
                        'month': month_display,
                        'total_sales': 0,
                        'order_count': 0
                    }

                # Add order data
                months_data[month_key]['order_count'] += 1

                # Calculate total sales for this order
                order_total = 0
                for item in order.items.all():
                    # Calculate item subtotal: unit_price * total_units
                    unit_price = item.finished_product.selling_price or 0
                    total_units = (
                        item.quantity_6_packs * 6 +
                        item.quantity_12_packs * 12 +
                        item.quantity_extra_items
                    )
                    order_total += unit_price * total_units

                months_data[month_key]['total_sales'] += order_total

            # Convert to list and sort by month
            monthly_sales = [months_data[key] for key in sorted(months_data.keys())]

            # Format monthly sales data
            monthly_sales_data = []
            for entry in monthly_sales:
                monthly_sales_data.append({
                    'month': entry['month'],  # Already formatted as '%b %Y'
                    'total_sales': float(entry['total_sales'] or 0),
                    'order_count': entry['order_count']
                })

            # Top selling products - we need to calculate manually
            # First, get all order items in the period
            order_items = OrderItem.objects.filter(
                order__created_at__gte=start_date,
                order__created_at__lte=end_date
            ).select_related('finished_product', 'finished_product__cutting_record')

            # Group by product and calculate totals
            products_data = {}

            for item in order_items:
                # Get product name
                product_name = None
                if hasattr(item.finished_product, 'cutting_record') and item.finished_product.cutting_record:
                    product_name = item.finished_product.cutting_record.product_name

                if not product_name:
                    product_name = f"Product #{item.finished_product.id}"

                # Initialize product data if not exists
                if product_name not in products_data:
                    products_data[product_name] = {
                        'product_name': product_name,
                        'total_units': 0,
                        'total_sales': 0
                    }

                # Calculate total units
                total_units = (
                    item.quantity_6_packs * 6 +
                    item.quantity_12_packs * 12 +
                    item.quantity_extra_items
                )

                # Calculate sales amount
                unit_price = item.finished_product.selling_price or 0
                sales_amount = unit_price * total_units

                # Add to product totals
                products_data[product_name]['total_units'] += total_units
                products_data[product_name]['total_sales'] += sales_amount

            # Convert to list and sort by total sales
            top_products_data = list(products_data.values())
            top_products_data.sort(key=lambda x: x['total_sales'], reverse=True)
            top_products_data = top_products_data[:5]

            # Sales by shop - we need to calculate manually
            # Get all orders in the period
            shop_orders = Order.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            ).select_related('shop')

            # Group by shop and calculate totals
            shops_data = {}

            for order in shop_orders:
                shop_name = order.shop.name

                # Initialize shop data if not exists
                if shop_name not in shops_data:
                    shops_data[shop_name] = {
                        'shop_name': shop_name,
                        'total_sales': 0,
                        'order_count': 0
                    }

                # Add order count
                shops_data[shop_name]['order_count'] += 1

                # Calculate total sales for this order
                order_total = 0
                for item in order.items.all():
                    # Calculate item subtotal: unit_price * total_units
                    unit_price = item.finished_product.selling_price or 0
                    total_units = (
                        item.quantity_6_packs * 6 +
                        item.quantity_12_packs * 12 +
                        item.quantity_extra_items
                    )
                    order_total += unit_price * total_units

                # Add to shop totals
                shops_data[shop_name]['total_sales'] += order_total

            # Convert to list and sort by total sales
            shop_sales_data = list(shops_data.values())
            shop_sales_data.sort(key=lambda x: x['total_sales'], reverse=True)
            shop_sales_data = shop_sales_data[:5]

            # Payment status distribution - we need to calculate manually
            # Get all orders in the period
            payment_orders = Order.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            )

            # Initialize counters
            paid_count = 0
            partially_paid_count = 0
            payment_due_count = 0
            total_paid = 0
            total_amount = 0

            # First pass: Calculate total amount and count orders by status
            for order in payment_orders:
                # Count by status
                if order.status == 'paid':
                    paid_count += 1
                elif order.status == 'partially_paid':
                    partially_paid_count += 1
                elif order.status == 'payment_due':
                    payment_due_count += 1

                # Calculate order total
                order_total = 0
                for item in order.items.all():
                    unit_price = item.finished_product.selling_price or 0
                    total_units = (
                        item.quantity_6_packs * 6 +
                        item.quantity_12_packs * 12 +
                        item.quantity_extra_items
                    )
                    order_total += unit_price * total_units

                # Add to total amount
                total_amount += order_total

                # For all orders, if status is 'paid', use the order total as the paid amount
                # Otherwise, use the recorded amount_paid
                if order.status == 'paid':
                    # Make sure we're counting the full order amount for paid orders
                    total_paid += order_total
                else:
                    # For other orders, use the recorded amount_paid
                    total_paid += float(order.amount_paid)

            # Special case: If all orders are marked as paid, ensure total_paid equals total_amount
            if paid_count > 0 and partially_paid_count == 0 and payment_due_count == 0:
                total_paid = total_amount

            # Create payment status object
            payment_status = {
                'paid_count': paid_count,
                'partially_paid_count': partially_paid_count,
                'payment_due_count': payment_due_count,
                'total_paid': total_paid,
                'total_amount': total_amount
            }

            # Calculate payment rate
            payment_rate = (total_paid / total_amount * 100) if total_amount > 0 else 0

            # Return all sales performance data
            return Response({
                'monthly_sales': monthly_sales_data,
                'top_products': top_products_data,
                'shop_sales': shop_sales_data,
                'payment_status': {
                    'paid_count': payment_status['paid_count'],
                    'partially_paid_count': payment_status['partially_paid_count'],
                    'payment_due_count': payment_status['payment_due_count'],
                    'total_paid': float(total_paid),
                    'total_amount': float(total_amount),
                    'payment_rate': round(payment_rate, 2)
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductIncomePercentageView(APIView):
    """
    API endpoint that returns product income percentage analysis.
    Shows which products generate more income as a percentage of total sales.
    """
    def get(self, request, format=None):
        try:
            # Get time period from query params (default to last 6 months)
            months = int(request.query_params.get('months', 6))

            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30 * months)

            # Get all order items in the period
            order_items = OrderItem.objects.filter(
                order__created_at__gte=start_date,
                order__created_at__lte=end_date
            ).select_related('finished_product', 'finished_product__cutting_record')

            # Group by product and calculate totals
            products_data = {}
            total_sales_amount = 0

            for item in order_items:
                # Get product name and ID
                product_name = None
                product_id = item.finished_product.id

                if hasattr(item.finished_product, 'cutting_record') and item.finished_product.cutting_record:
                    product_name = item.finished_product.cutting_record.product_name

                if not product_name:
                    product_name = f"Product #{item.finished_product.id}"

                # Initialize product data if not exists
                if product_id not in products_data:
                    manufacture_price = item.finished_product.manufacture_price or 0
                    selling_price = item.finished_product.selling_price or 0

                    # Calculate profit margin if both prices are available
                    profit_margin = 0
                    if selling_price > 0 and manufacture_price > 0:
                        profit_margin = ((selling_price - manufacture_price) / selling_price) * 100

                    products_data[product_id] = {
                        'product_id': product_id,
                        'product_name': product_name,
                        'total_units': 0,
                        'total_sales': 0,
                        'manufacture_price': manufacture_price,
                        'selling_price': selling_price,
                        'profit_margin': round(profit_margin, 2)
                    }

                # Calculate total units
                total_units = (
                    item.quantity_6_packs * 6 +
                    item.quantity_12_packs * 12 +
                    item.quantity_extra_items
                )

                # Calculate sales amount
                unit_price = item.finished_product.selling_price or 0
                sales_amount = unit_price * total_units

                # Add to product totals
                products_data[product_id]['total_units'] += total_units
                products_data[product_id]['total_sales'] += sales_amount

                # Add to total sales amount
                total_sales_amount += sales_amount

            # Convert to list
            products_list = list(products_data.values())

            # Calculate income percentage for each product
            for product in products_list:
                if total_sales_amount > 0:
                    product['income_percentage'] = round((product['total_sales'] / total_sales_amount) * 100, 2)
                else:
                    product['income_percentage'] = 0

            # Sort by income percentage (highest first)
            products_list.sort(key=lambda x: x['income_percentage'], reverse=True)

            # Return the product income percentage data
            return Response({
                'total_sales_amount': float(total_sales_amount),
                'products': products_list
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
