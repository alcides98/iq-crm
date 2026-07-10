from django.db import models
from apps.authentication.models import User


class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    overdue_tasks = models.BooleanField(default=True)
    followup_reminders = models.BooleanField(default=True)
    installment_due = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f'Preferencias de {self.user.email}'
