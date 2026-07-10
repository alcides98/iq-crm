from django.db import models
from apps.authentication.models import User


class Client(models.Model):
    TYPE_CHOICES = [('empresa', 'Empresa'), ('persona', 'Persona Física')]
    STATUS_CHOICES = [
        ('prospecto', 'Prospecto'),
        ('nuevo', 'Nuevo'),
        ('recurrente', 'Recurrente'),
        ('partner', 'Partner'),
        ('inactivo', 'Inactivo'),
    ]
    SOURCE_CHOICES = [
        ('referido', 'Referido'), ('linkedin', 'LinkedIn'),
        ('instagram', 'Instagram'), ('networking', 'Networking'),
        ('webinar', 'Webinar'), ('cliente_actual', 'Cliente actual'),
        ('cold_call', 'Cold Call'), ('evento', 'Evento'),
        ('pagina_web', 'Página Web'), ('otro', 'Otro'),
    ]
    CITY_CHOICES = [
        ('asuncion', 'Asunción'), ('alto_parana', 'Alto Paraná'),
        ('central', 'Central'), ('itapua', 'Itapúa'),
        ('amambay', 'Amambay'), ('caaguazu', 'Caaguazú'),
        ('cordillera', 'Cordillera'), ('guaira', 'Guairá'),
        ('paraguari', 'Paraguarí'), ('misiones', 'Misiones'),
        ('neembucu', 'Ñeembucú'), ('concepcion', 'Concepción'),
        ('san_pedro', 'San Pedro'), ('canindeyu', 'Canindeyú'),
        ('presidente_hayes', 'Presidente Hayes'),
        ('alto_paraguay', 'Alto Paraguay'), ('boqueron', 'Boquerón'),
    ]

    client_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='prospecto')
    company_name = models.CharField(max_length=200)
    ruc = models.CharField(max_length=20, blank=True)
    ci = models.CharField(max_length=20, blank=True)

    contact_name = models.CharField(max_length=200)
    contact_position = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)

    address = models.CharField(max_length=300, blank=True)
    city = models.CharField(max_length=50, choices=CITY_CHOICES, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES)
    notes = models.TextField(blank=True)
    document_link = models.URLField(blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='clients_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'

    def __str__(self):
        return self.company_name

    def validate_ruc(self):
        """Validar dígito verificador RUC paraguayo — algoritmo módulo 11"""
        clean = self.ruc.replace('-', '').replace(' ', '')
        if not clean:
            return True
        if len(clean) < 2:
            return False
        digits = clean[:-1]
        check = int(clean[-1])
        base = 2
        total = 0
        for d in reversed(digits):
            total += int(d) * base
            base = base + 1 if base < 9 else 2
        remainder = 11 - (total % 11)
        expected = 0 if remainder >= 10 else remainder
        return expected == check


class Contact(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='contacts')
    name = models.CharField(max_length=200)
    position = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    is_primary = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-is_primary', 'name']

    def __str__(self):
        return f'{self.name} ({self.client.company_name})'
