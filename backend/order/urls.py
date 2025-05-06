from django.urls import path
from .views import (
    OrderItemCreateView,
    OrderListCreateView,
    OrderDetailView,
    OrderApproveView,
    ShopListCreateView,
    ShopCreateView,
    OrderSubmitView,
    GenerateInvoiceView,
    MarkOrderDeliveredView,
    RecordPaymentView,
    OrderPaymentsListView
)

urlpatterns = [
    path('shops/', ShopListCreateView.as_view(), name='shop-list-create'),
    path('shops/create/', ShopCreateView.as_view(), name='shop-create'),
    path('orders/create/', OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/items/', OrderItemCreateView.as_view(), name='orderitem-list-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/approve/', OrderApproveView.as_view(), name='order-approve'),
    path('orders/<int:order_id>/items/', OrderItemCreateView.as_view(), name='orderitem-create'),
    path('orders/<int:pk>/submit/', OrderSubmitView.as_view(), name='order-submit'),
    path('orders/<int:pk>/generate-invoice/', GenerateInvoiceView.as_view(), name='generate-invoice'),
    path('orders/<int:pk>/mark-delivered/', MarkOrderDeliveredView.as_view(), name='mark-delivered'),
    path('orders/<int:pk>/record-payment/', RecordPaymentView.as_view(), name='record-payment'),
    path('orders/<int:pk>/payments/', OrderPaymentsListView.as_view(), name='order-payments-list'),

    # Duplicate paths to match frontend expectations
    path('orders/orders/create/', OrderListCreateView.as_view(), name='order-list-create-alt'),
    path('orders/orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail-alt'),
    path('orders/orders/<int:pk>/approve/', OrderApproveView.as_view(), name='order-approve-alt'),
    path('orders/orders/<int:pk>/submit/', OrderSubmitView.as_view(), name='order-submit-alt'),
    path('orders/orders/<int:pk>/generate-invoice/', GenerateInvoiceView.as_view(), name='generate-invoice-alt'),
    path('orders/orders/<int:pk>/mark-delivered/', MarkOrderDeliveredView.as_view(), name='mark-delivered-alt'),
    path('orders/orders/<int:pk>/record-payment/', RecordPaymentView.as_view(), name='record-payment-alt'),
    path('orders/orders/<int:pk>/payments/', OrderPaymentsListView.as_view(), name='order-payments-list-alt'),
]
