from django.urls import path
from .views import ApproveFinishedProductView

urlpatterns = [
    path('approve/', ApproveFinishedProductView.as_view(), name='approve-finished-product'),
]
