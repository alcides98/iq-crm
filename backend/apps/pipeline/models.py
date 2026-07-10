from django.db import models
from apps.authentication.models import User
from apps.clients.models import Client


class Deal(models.Model):
    PHASE_CHOICES = [
        ('nueva', 'Nueva Negociación'),
        ('diagnostico', 'Diagnóstico'),
        ('propuesta', 'Envío de Propuesta'),
        ('replanteo', 'Replanteo / Ajustes'),
        ('perdida', 'Negociación Perdida'),
        ('ganada', 'Negociación Ganada'),
    ]
    PROBABILITY_BY_PHASE = {
        'nueva': 10, 'diagnostico': 30, 'propuesta': 60,
        'replanteo': 75, 'perdida': 0, 'ganada': 100,
    }
    SERVICE_CHOICES = [
        ('capacitacion', 'Capacitación'), ('coaching', 'Coaching'),
        ('consultoria', 'Consultoría'), ('conferencia', 'Conferencia'),
        ('outdoor', 'Outdoor'), ('webinar', 'Webinar'),
        ('programa', 'Programa Integral'), ('otro', 'Otro'),
    ]
    PRIORITY_CHOICES = [('normal', 'Normal'), ('alta', 'Alta'), ('urgente', 'Urgente')]
    LOSS_REASONS = [
        ('precio', 'Precio'), ('sin_presupuesto', 'Sin presupuesto'),
        ('competencia', 'Competencia'), ('falta_seguimiento', 'Falta de seguimiento'),
        ('cancelacion', 'Cancelación del proyecto'), ('no_prioridad', 'No era prioridad'),
        ('tiempo', 'Tiempo'), ('no_respondio', 'No respondió'), ('otro', 'Otro'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='deals')
    name = models.CharField(max_length=200)
    service_type = models.CharField(max_length=30, choices=SERVICE_CHOICES)
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES, default='nueva')
    probability = models.IntegerField(default=10)
    amount = models.DecimalField(max_digits=15, decimal_places=0, null=True, blank=True)
    amount_original = models.DecimalField(max_digits=15, decimal_places=0, null=True, blank=True)
    amount_usd = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    document_link = models.URLField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='deals')

    start_date = models.DateField(auto_now_add=True)
    estimated_close_date = models.DateField(null=True, blank=True)
    actual_close_date = models.DateField(null=True, blank=True)
    next_followup = models.DateField(null=True, blank=True)
    last_followup = models.DateField(null=True, blank=True)

    initial_need = models.TextField(blank=True)
    diagnosis_notes = models.TextField(blank=True)
    proposal_link = models.URLField(blank=True)
    proposal_ppt_link = models.URLField(blank=True)
    replan_reason = models.CharField(max_length=30, blank=True)
    replan_notes = models.TextField(blank=True)
    loss_reason = models.CharField(max_length=30, choices=LOSS_REASONS, blank=True)
    loss_notes = models.TextField(blank=True)
    reactivation_date = models.DateField(null=True, blank=True)

    next_step = models.CharField(max_length=300, blank=True)
    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='deals_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Negociación'
        verbose_name_plural = 'Negociaciones'

    def __str__(self):
        return f'{self.name} — {self.client.company_name}'

    def save(self, *args, **kwargs):
        self.probability = self.PROBABILITY_BY_PHASE.get(self.phase, self.probability)
        is_new_win = (
            self.phase == 'ganada'
            and self.pk
            and not getattr(self, '_project_created', False)
        )
        super().save(*args, **kwargs)
        if is_new_win:
            self._auto_create_project()
            self._project_created = True

    def _auto_create_project(self):
        from apps.tasks.models import Project
        if not hasattr(self, 'project'):
            Project.objects.create(
                deal=self,
                name=f'Proyecto: {self.name}',
                client=self.client,
                responsible=self.assigned_to,
                start_date=self.actual_close_date,
            )


class PipelineStage(models.Model):
    COLOR_CHOICES = [
        ('blue', 'Azul'), ('amber', 'Ámbar'), ('orange', 'Naranja'),
        ('purple', 'Morado'), ('red', 'Rojo'), ('green', 'Verde'),
        ('gray', 'Gris'), ('teal', 'Turquesa'), ('pink', 'Rosa'),
    ]

    name = models.CharField(max_length=100)
    slug = models.CharField(max_length=30)
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='blue')
    probability = models.IntegerField(default=10)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_terminal = models.BooleanField(default=False)
    is_won = models.BooleanField(default=False)

    class Meta:
        ordering = ['order']
        verbose_name = 'Etapa del Pipeline'
        verbose_name_plural = 'Etapas del Pipeline'

    def __str__(self):
        return self.name


class PhaseTransitionLog(models.Model):
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='phase_logs')
    from_phase = models.CharField(max_length=20)
    to_phase = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.deal} | {self.from_phase} → {self.to_phase}'
