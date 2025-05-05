# packing/urls.py
from django.urls import path
from .views import PackingSessionCreateView, PackingSessionListView

urlpatterns = [
    path('sessions/', PackingSessionCreateView.as_view(), name='add-packing-session'),
    path('sessions/history/', PackingSessionListView.as_view(), name='packing-session-history'),
]
