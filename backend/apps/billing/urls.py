from django.urls import path
from .views import (
    PaymentListCreateView, PaymentDetailView,
    InstallmentListCreateView, InstallmentDetailView,
    FacturaListCreateView, FacturaDetailView, FacturaResumenView,
    PagoFacturaListCreateView, PagoFacturaDetailView,
    EgresoListCreateView, EgresoDetailView, EgresoResumenView,
    PagoEgresoListCreateView, PagoEgresoDetailView,
)

urlpatterns = [
    # Facturas (ingresos)
    path('facturas/',              FacturaListCreateView.as_view(),  name='factura-list'),
    path('facturas/resumen/',      FacturaResumenView.as_view(),     name='factura-resumen'),
    path('facturas/<int:pk>/',     FacturaDetailView.as_view(),      name='factura-detail'),
    path('facturas/<int:pk>/pagos/', PagoFacturaListCreateView.as_view(), name='pagofactura-list'),
    path('pagos-factura/<int:pk>/', PagoFacturaDetailView.as_view(), name='pagofactura-detail'),

    # Egresos
    path('egresos/',               EgresoListCreateView.as_view(),   name='egreso-list'),
    path('egresos/resumen/',       EgresoResumenView.as_view(),      name='egreso-resumen'),
    path('egresos/<int:pk>/',      EgresoDetailView.as_view(),       name='egreso-detail'),
    path('egresos/<int:pk>/pagos/', PagoEgresoListCreateView.as_view(), name='pagoegreso-list'),
    path('pagos-egreso/<int:pk>/', PagoEgresoDetailView.as_view(),  name='pagoegreso-detail'),

    # Payments (cobros por deal)
    path('payments/',              PaymentListCreateView.as_view(),  name='payment-list'),
    path('payments/<int:pk>/',     PaymentDetailView.as_view(),      name='payment-detail'),
    path('payments/<int:pk>/installments/', InstallmentListCreateView.as_view(), name='installment-list'),
    path('installments/<int:pk>/', InstallmentDetailView.as_view(),  name='installment-detail'),
]
