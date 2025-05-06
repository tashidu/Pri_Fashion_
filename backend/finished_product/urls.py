from django.urls import path
from .views import (
    ApproveFinishedProductView,
    FinishedProductReportView,
    FinishedProductStatusView,
    UpdateFinishedProductView,
    UpdateProductImageView,
    SalesProductListView,
    UploadProductImageView,
    UploadMultipleProductImagesView
)

urlpatterns = [
    path('approve/', ApproveFinishedProductView.as_view(), name='approve-finished-product'),
    path('report/', FinishedProductReportView.as_view(), name='finished-product-report'),
    path('status/<int:cutting_record_id>/', FinishedProductStatusView.as_view(), name='finished-product-status'),
    path('update/<int:pk>/', UpdateFinishedProductView.as_view(), name='update-finished-product'),
    path('update-image/<int:pk>/', UpdateProductImageView.as_view(), name='update-product-image'),
    path('sales-products/', SalesProductListView.as_view(), name='sales-products'),
    path('upload-image/<int:pk>/', UploadProductImageView.as_view(), name='upload-product-image'),
    path('upload-multiple-images/<int:pk>/', UploadMultipleProductImagesView.as_view(), name='upload-multiple-product-images'),
]
