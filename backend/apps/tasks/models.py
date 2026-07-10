from django.db import models
from apps.authentication.models import User
from apps.clients.models import Client


class Project(models.Model):
    STATUS_CHOICES = [
        ('active', 'Activo'), ('paused', 'Pausado'),
        ('completed', 'Completado'), ('cancelled', 'Cancelado'),
    ]

    deal = models.OneToOneField(
        'pipeline.Deal', on_delete=models.SET_NULL, null=True, blank=True, related_name='project'
    )
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    responsible = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='projects_responsible')
    participants = models.ManyToManyField(User, blank=True, related_name='projects_participating')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    drive_folder_link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Proyecto'
        verbose_name_plural = 'Proyectos'

    def __str__(self):
        return self.name

    @property
    def progress(self):
        from django.db.models import Q, Avg
        q = Q(project=self)
        if self.deal_id:
            q |= Q(deal_id=self.deal_id)
        tasks = Task.objects.filter(q).exclude(status='cancelled').distinct()
        if not tasks.exists():
            return 0
        return int(tasks.aggregate(avg=Avg('progress_percent'))['avg'] or 0)


class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'), ('in_progress', 'En Proceso'),
        ('waiting', 'En Espera'), ('completed', 'Finalizado'), ('cancelled', 'Cancelado'),
    ]
    PRIORITY_CHOICES = [('normal', 'Normal'), ('high', 'Alta'), ('urgent', 'Urgente')]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    deal = models.ForeignKey(
        'pipeline.Deal', on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks'
    )
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='tasks')
    participants = models.ManyToManyField(User, blank=True, related_name='tasks_participating')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    progress_percent = models.IntegerField(default=0)
    depends_on = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='dependents')
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    notes = models.TextField(blank=True)
    document_link = models.URLField(blank=True)
    alert_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', '-priority']
        verbose_name = 'Tarea'
        verbose_name_plural = 'Tareas'

    def __str__(self):
        return self.name

    def recalculate_progress(self):
        items = self.checklist_items.all()
        if items.exists():
            total = items.count()
            done = items.filter(is_done=True).count()
            self.progress_percent = int(done / total * 100) if total > 0 else 0
            self.save(update_fields=['progress_percent'])


class ChecklistItem(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='checklist_items')
    text = models.CharField(max_length=300)
    is_done = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = 'Item de checklist'
        verbose_name_plural = 'Items de checklist'

    def __str__(self):
        return self.text
