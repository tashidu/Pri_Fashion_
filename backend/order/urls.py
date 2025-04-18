from django.urls import path
from .views import OrderItemCreateView, OrderListCreateView, OrderDetailView, OrderApproveView, ShopListCreateView , ShopCreateView , OrderSubmitView

urlpatterns = [
    path('shops/', ShopListCreateView.as_view(), name='shop-list-create'),
    path('shops/create/', ShopCreateView.as_view(), name='shop-create'),
    path('orders/create/', OrderListCreateView.as_view(), name='order-list-create'),
    path ('orders/items/', OrderItemCreateView.as_view(), name='orderitem-list-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/approve/', OrderApproveView.as_view(), name='order-approve'),
    path('orders/<int:order_id>/items/', OrderItemCreateView.as_view(), name='orderitem-create'),
    path('orders/<int:pk>/submit/', OrderSubmitView.as_view(), name='order-submit'),
]
