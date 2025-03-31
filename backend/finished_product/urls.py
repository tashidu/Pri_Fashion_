from django.urls import path
from .views import ApproveFinishedProductView , FinishedProductReportView

urlpatterns = [
    path('approve/', ApproveFinishedProductView.as_view(), name='approve-finished-product'),
     path('report/', FinishedProductReportView.as_view(), name='finished-product-report'),
]
