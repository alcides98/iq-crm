from django.urls import path
from .views import KPIView, AlertsView

urlpatterns = [
    path('kpis/', KPIView.as_view(), name='kpis'),
    path('alerts/', AlertsView.as_view(), name='alerts'),
]
