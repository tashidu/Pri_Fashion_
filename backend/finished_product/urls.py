from django.urls import path
from .views import (
    ApproveFinishedProductView,
    FinishedProductReportView,
    FinishedProductStatusView,
    UpdateFinishedProductView,
    UpdateProductImageView
)

urlpatterns = [
    path('approve/', ApproveFinishedProductView.as_view(), name='approve-finished-product'),
    path('report/', FinishedProductReportView.as_view(), name='finished-product-report'),
    path('status/<int:cutting_record_id>/', FinishedProductStatusView.as_view(), name='finished-product-status'),
    path('update/<int:pk>/', UpdateFinishedProductView.as_view(), name='update-finished-product'),
    path('update-image/<int:pk>/', UpdateProductImageView.as_view(), name='update-product-image'),
]
