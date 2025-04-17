# packing/urls.py
from django.urls import path
from .views import PackingSessionCreateView

urlpatterns = [
    path('sessions/', PackingSessionCreateView.as_view(), name='add-packing-session'),
]
