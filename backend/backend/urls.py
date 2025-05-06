
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
     path('api/', include('fabric.urls')),
    path('api/cutting/', include('cutting.urls')),
    path('api/sewing/', include('sewing.urls')),
    path('api/finished_product/', include('finished_product.urls')),
    path('api/packing/', include('packing_app.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/orders/', include('order.urls')),

]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
