from django.db import models
from apps.authentication.models import User
from apps.clients.models import Client


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Borrador'), ('sent', 'Enviado a SIFEN'),
        ('approved', 'Aprobado'), ('rejected', 'Rechazado'), ('cancelled', 'Cancelado'),
    ]
    TYPE_CHOICES = [('factura', 'Factura'), ('nota_credito', 'Nota de Crédito')]

    deal = models.ForeignKey(
        'pipeline.Deal', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices'
    )
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='invoices')
    invoice_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='factura')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    cdc = models.CharField(max_length=44, blank=True, unique=True, null=True)
    number = models.CharField(max_length=20, blank=True)
    xml_content = models.TextField(blank=True)
    kude_url = models.URLField(blank=True)

    amount_subtotal = models.DecimalField(max_digits=15, decimal_places=0)
    iva_5 = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    iva_10 = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    amount_total = models.DecimalField(max_digits=15, decimal_places=0)

    issued_at = models.DateTimeField(null=True, blank=True)
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    sifen_response = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'

    def __str__(self):
        return f'{self.get_invoice_type_display()} {self.number or self.id} — {self.client.company_name}'
