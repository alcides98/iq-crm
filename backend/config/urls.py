from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/clients/', include('apps.clients.urls')),
    path('api/v1/pipeline/', include('apps.pipeline.urls')),
    path('api/v1/tasks/', include('apps.tasks.urls')),
    path('api/v1/billing/', include('apps.billing.urls')),
    path('api/v1/invoicing/', include('apps.invoicing.urls')),
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
