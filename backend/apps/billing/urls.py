from django.urls import path
from .views import (
    PaymentListCreateView, PaymentDetailView,
    InstallmentListCreateView, InstallmentDetailView,
    FacturaListCreateView, FacturaDetailView, FacturaResumenView,
)

urlpatterns = [
    # Facturas
    path('facturas/', FacturaListCreateView.as_view(), name='factura-list'),
    path('facturas/resumen/', FacturaResumenView.as_view(), name='factura-resumen'),
    path('facturas/<int:pk>/', FacturaDetailView.as_view(), name='factura-detail'),
    # Payments (cobros por deal)
    path('payments/', PaymentListCreateView.as_view(), name='payment-list'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('payments/<int:pk>/installments/', InstallmentListCreateView.as_view(), name='installment-list'),
    path('installments/<int:pk>/', InstallmentDetailView.as_view(), name='installment-detail'),
]
