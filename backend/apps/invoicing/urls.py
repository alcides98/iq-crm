from django.urls import path
from .views import InvoiceListCreateView, InvoiceDetailView, InvoiceSendView, InvoiceCancelView, InvoiceKudeView

urlpatterns = [
    path('invoices/', InvoiceListCreateView.as_view(), name='invoice-list'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),
    path('invoices/<int:pk>/send/', InvoiceSendView.as_view(), name='invoice-send'),
    path('invoices/<int:pk>/cancel/', InvoiceCancelView.as_view(), name='invoice-cancel'),
    path('invoices/<int:pk>/kude/', InvoiceKudeView.as_view(), name='invoice-kude'),
]
