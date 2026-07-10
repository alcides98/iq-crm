from django.urls import path
from .views import (
    PaymentListCreateView, PaymentDetailView,
    InstallmentListCreateView, InstallmentDetailView,
)

urlpatterns = [
    path('payments/', PaymentListCreateView.as_view(), name='payment-list'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('payments/<int:pk>/installments/', InstallmentListCreateView.as_view(), name='installment-list'),
    path('installments/<int:pk>/', InstallmentDetailView.as_view(), name='installment-detail'),
]
