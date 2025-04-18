# views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Shop, Order, OrderItem
from .serializers import ShopSerializer, OrderSerializer, OrderItemSerializer
from django.shortcuts import get_object_or_404
from packing_app.models import PackingInventory
from finished_product.models import FinishedProduct
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated

class ShopListCreateView(generics.ListCreateAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer

class ShopCreateView(generics.CreateAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    
    
    
class OrderListCreateView(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderApproveView(APIView):
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)

            if order.status == 'approved':
                return Response({"error": "Order is already approved"}, status=status.HTTP_400_BAD_REQUEST)

            order.status = 'approved'
            order.save()

            return Response({"status": "approved", "order_id": order.id}, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

class OrderItemCreateView(generics.CreateAPIView):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer

    def perform_create(self, serializer):
        order_id = self.request.data.get('order')
        finished_product_id = self.request.data.get('finished_product')

        if not order_id or not finished_product_id:
            raise serializers.ValidationError({'error': 'Order and Finished Product IDs are required.'})

        order = get_object_or_404(Order, id=order_id)
        finished_product = get_object_or_404(FinishedProduct, id=finished_product_id)
        inventory = get_object_or_404(PackingInventory, finished_product=finished_product)

        # Get quantities from request
        six_packs = int(self.request.data.get('quantity_6_packs', 0))
        twelve_packs = int(self.request.data.get('quantity_12_packs', 0))
        extras = int(self.request.data.get('quantity_extra_items', 0))

        # Optional: Validate stock before deduction
        if (inventory.number_of_6_packs < six_packs or
            inventory.number_of_12_packs < twelve_packs or
            inventory.extra_items < extras):
            raise serializers.ValidationError({'error': 'Not enough inventory to fulfill the order.'})

        # Save order item and deduct inventory
        serializer.save(order=order, finished_product=finished_product)
        inventory.deduct_for_order(six_packs, twelve_packs, extras)
        
        
        
        
class OrderSubmitView(APIView):
    """
    Lets Order Coordinator mark an order as 'submitted' (finished preparing).
    """
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)

            if order.status != 'draft':
                return Response({"error": "Only draft orders can be submitted."}, status=status.HTTP_400_BAD_REQUEST)

            order.status = 'submitted'
            order.save()

            return Response({"status": "submitted", "order_id": order.id}, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        