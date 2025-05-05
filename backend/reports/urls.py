# reports/urls.py
from django.urls import path
from .views import ProductPackingReportView
from .dashboard_views import (
    DashboardStatsView,
    RecentActivityView,
    LowStockItemsView,
    ProductionTrendsView,
    ColorAnalysisView,
    FabricStockView
)

urlpatterns = [
    path('product-packing-report/', ProductPackingReportView.as_view(), name='product-packing-report'),

    # Dashboard API endpoints
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/recent-activity/', RecentActivityView.as_view(), name='recent-activity'),
    path('dashboard/low-stock/', LowStockItemsView.as_view(), name='low-stock'),
    path('dashboard/production-trends/', ProductionTrendsView.as_view(), name='production-trends'),
    path('dashboard/color-analysis/', ColorAnalysisView.as_view(), name='color-analysis'),
    path('dashboard/fabric-stock/', FabricStockView.as_view(), name='fabric-stock'),
]
