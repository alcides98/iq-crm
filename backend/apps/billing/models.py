from django.db import models
from datetime import date


class Factura(models.Model):
    STATUS_CHOICES = [
        ('facturado', 'Facturado'),
        ('pendiente', 'Pendiente'),
        ('parcial',   'Pago parcial'),
        ('cobrado',   'Cobrado'),
    ]

    client = models.ForeignKey(
        'clients.Client', on_delete=models.CASCADE, related_name='facturas'
    )
    numero_factura = models.CharField(max_length=50)
    fecha = models.DateField()
    detalle_servicio = models.TextField()
    monto = models.DecimalField(max_digits=15, decimal_places=0)
    fecha_vencimiento = models.DateField()
    fecha_cobro = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=STATUS_CHOICES, default='facturado')
    notas = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'authentication.User', on_delete=models.SET_NULL,
        null=True, related_name='facturas_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha', '-created_at']
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'

    def __str__(self):
        return f'Factura {self.numero_factura} — {self.client.company_name}'

    @property
    def monto_pagado(self):
        return int(self.pagos.aggregate(t=models.Sum('monto'))['t'] or 0)

    @property
    def saldo_pendiente(self):
        return int(self.monto) - self.monto_pagado

    @property
    def dias_atraso(self):
        if self.estado == 'cobrado':
            return 0
        today = date.today()
        if self.fecha_vencimiento < today:
            return (today - self.fecha_vencimiento).days
        return 0

    @property
    def dias_para_vencer(self):
        if self.estado == 'cobrado':
            return None
        today = date.today()
        delta = (self.fecha_vencimiento - today).days
        return delta if delta >= 0 else 0


class PagoFactura(models.Model):
    """Pago parcial o total de una factura (ingreso)"""
    METODO_CHOICES = [
        ('efectivo',      'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('cheque',        'Cheque'),
        ('tarjeta',       'Tarjeta'),
    ]

    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='pagos')
    monto = models.DecimalField(max_digits=15, decimal_places=0)
    fecha = models.DateField()
    metodo = models.CharField(max_length=20, choices=METODO_CHOICES, default='transferencia')
    notas = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha', '-created_at']
        verbose_name = 'Pago de factura'
        verbose_name_plural = 'Pagos de facturas'

    def __str__(self):
        return f'Pago ₲{self.monto} — {self.factura.numero_factura}'


class Egreso(models.Model):
    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('parcial',   'Pago parcial'),
        ('pagado',    'Pagado'),
    ]
    CATEGORIA_CHOICES = [
        ('proveedor', 'Proveedor'),
        ('servicio',  'Servicio'),
        ('salario',   'Salario'),
        ('impuesto',  'Impuesto'),
        ('alquiler',  'Alquiler'),
        ('marketing', 'Marketing'),
        ('otro',      'Otro'),
    ]

    descripcion = models.CharField(max_length=300)
    proveedor = models.CharField(max_length=200, blank=True)
    categoria = models.CharField(max_length=30, choices=CATEGORIA_CHOICES, default='otro')
    monto = models.DecimalField(max_digits=15, decimal_places=0)
    fecha = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendiente')
    notas = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'authentication.User', on_delete=models.SET_NULL,
        null=True, related_name='egresos_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha', '-created_at']
        verbose_name = 'Egreso'
        verbose_name_plural = 'Egresos'

    def __str__(self):
        return f'Egreso: {self.descripcion}'

    @property
    def monto_pagado(self):
        return int(self.pagos.aggregate(t=models.Sum('monto'))['t'] or 0)

    @property
    def saldo_pendiente(self):
        return int(self.monto) - self.monto_pagado

    @property
    def dias_atraso(self):
        if self.estado == 'pagado':
            return 0
        if not self.fecha_vencimiento:
            return 0
        today = date.today()
        if self.fecha_vencimiento < today:
            return (today - self.fecha_vencimiento).days
        return 0


class PagoEgreso(models.Model):
    """Pago parcial o total de un egreso"""
    METODO_CHOICES = [
        ('efectivo',      'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('cheque',        'Cheque'),
        ('tarjeta',       'Tarjeta'),
    ]

    egreso = models.ForeignKey(Egreso, on_delete=models.CASCADE, related_name='pagos')
    monto = models.DecimalField(max_digits=15, decimal_places=0)
    fecha = models.DateField()
    metodo = models.CharField(max_length=20, choices=METODO_CHOICES, default='transferencia')
    notas = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha', '-created_at']
        verbose_name = 'Pago de egreso'
        verbose_name_plural = 'Pagos de egresos'

    def __str__(self):
        return f'Pago ₲{self.monto} — {self.egreso.descripcion}'


# ─── Payment / Installment (cobros por deal — sin cambios) ────────────────────

class Payment(models.Model):
    METHOD_CHOICES = [
        ('efectivo', 'Efectivo'), ('transferencia', 'Transferencia'),
        ('cheque', 'Cheque'), ('tarjeta', 'Tarjeta'), ('cuotas', 'Cuotas'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pendiente'), ('partial', 'Parcial'),
        ('paid', 'Cobrado'), ('overdue', 'Vencido'),
    ]

    deal = models.OneToOneField('pipeline.Deal', on_delete=models.CASCADE, related_name='payment')
    total_amount = models.DecimalField(max_digits=15, decimal_places=0)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    installments_count = models.IntegerField(default=1)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Cobro'
        verbose_name_plural = 'Cobros'

    def __str__(self):
        return f'Cobro {self.deal.name}'

    @property
    def pending_amount(self):
        return self.total_amount - self.paid_amount


class Installment(models.Model):
    STATUS_CHOICES = [('pending', 'Pendiente'), ('paid', 'Cobrado'), ('overdue', 'Vencido')]

    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='installments')
    number = models.IntegerField()
    amount = models.DecimalField(max_digits=15, decimal_places=0)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    alert_sent = models.BooleanField(default=False)

    class Meta:
        ordering = ['number']
        unique_together = [['payment', 'number']]

    def __str__(self):
        return f'Cuota {self.number} — {self.payment.deal.name}'
