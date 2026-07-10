from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def check_overdue_tasks():
    from apps.tasks.models import Task
    overdue = Task.objects.filter(
        due_date__lt=timezone.now().date(),
        status__in=['pending', 'in_progress'],
        alert_sent=False,
    )
    for task in overdue:
        send_task_overdue_alert.delay(task.id)
        task.alert_sent = True
        task.save(update_fields=['alert_sent'])


@shared_task
def check_followup_reminders():
    from apps.pipeline.models import Deal
    tomorrow = timezone.now().date() + timezone.timedelta(days=1)
    deals = Deal.objects.filter(
        next_followup=tomorrow,
        phase__in=['nueva', 'diagnostico', 'propuesta', 'replanteo'],
    )
    for deal in deals:
        send_followup_reminder.delay(deal.id)


@shared_task
def check_installment_due():
    from apps.billing.models import Installment
    in_3_days = timezone.now().date() + timezone.timedelta(days=3)
    installments = Installment.objects.filter(
        due_date=in_3_days,
        status='pending',
        alert_sent=False,
    )
    for inst in installments:
        send_installment_reminder.delay(inst.id)
        inst.alert_sent = True
        inst.save(update_fields=['alert_sent'])


@shared_task
def send_task_overdue_alert(task_id):
    from apps.tasks.models import Task
    try:
        task = Task.objects.select_related('assigned_to', 'project').get(id=task_id)
    except Task.DoesNotExist:
        return
    if not task.assigned_to or not task.assigned_to.email:
        return
    send_mail(
        subject=f'[Wolf CRM] Tarea vencida: {task.name}',
        message=(
            f'Hola {task.assigned_to.first_name},\n\n'
            f'La tarea "{task.name}" venció el {task.due_date}.\n\n'
            f'Por favor actualizá su estado en el sistema.\n\nWolf CRM'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[task.assigned_to.email],
        fail_silently=True,
    )


@shared_task
def send_followup_reminder(deal_id):
    from apps.pipeline.models import Deal
    try:
        deal = Deal.objects.select_related('assigned_to', 'client').get(id=deal_id)
    except Deal.DoesNotExist:
        return
    if not deal.assigned_to or not deal.assigned_to.email:
        return
    send_mail(
        subject=f'[Wolf CRM] Recordatorio de seguimiento: {deal.client.company_name}',
        message=(
            f'Hola {deal.assigned_to.first_name},\n\n'
            f'Mañana tenés programado un seguimiento con {deal.client.company_name}.\n'
            f'Negociación: {deal.name}\n'
            f'Próximo paso: {deal.next_step or "Sin definir"}\n\nWolf CRM'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[deal.assigned_to.email],
        fail_silently=True,
    )


@shared_task
def send_installment_reminder(installment_id):
    from apps.billing.models import Installment
    try:
        inst = Installment.objects.select_related('payment__deal__assigned_to').get(id=installment_id)
    except Installment.DoesNotExist:
        return
    user = inst.payment.deal.assigned_to
    if not user or not user.email:
        return
    send_mail(
        subject=f'[Wolf CRM] Cuota próxima a vencer — {inst.payment.deal.name}',
        message=(
            f'Hola {user.first_name},\n\n'
            f'La cuota #{inst.number} de {inst.payment.deal.name} vence en 3 días ({inst.due_date}).\n'
            f'Monto: ₲ {inst.amount:,}\n\nWolf CRM'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


@shared_task
def schedule_followup_reminder(deal_id):
    send_followup_reminder.delay(deal_id)
