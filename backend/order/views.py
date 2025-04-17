# views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Shop, Order, OrderItem
from .serializers import ShopSerializer, OrderSerializer, OrderItemSerializer

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
    serializer_class = OrderItemSerializer

    def perform_create(self, serializer):
        order_id = self.kwargs['order_id']  # Get order_id from URL
        serializer.save(order_id=order_id)  # Save order_id to the order item
