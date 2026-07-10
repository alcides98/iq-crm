from celery import shared_task
from django.utils import timezone


@shared_task
def create_project_from_deal(deal_id):
    from apps.pipeline.models import Deal
    from apps.tasks.models import Project, Task

    try:
        deal = Deal.objects.get(id=deal_id)
    except Deal.DoesNotExist:
        return

    if hasattr(deal, 'project'):
        return

    project = Project.objects.create(
        deal=deal,
        client=deal.client,
        name=f'Proyecto: {deal.name}',
        responsible=deal.assigned_to,
        start_date=timezone.now().date(),
    )

    initial_tasks = [
        'Confirmar contrato firmado',
        'Enviar factura al cliente',
        'Aprobar cronograma',
        'Definir participantes del cliente',
        'Preparar materiales del servicio',
        'Crear carpeta en Google Drive',
        'Crear grupo de WhatsApp del proyecto',
    ]

    due = timezone.now().date() + timezone.timedelta(days=3)
    for task_name in initial_tasks:
        Task.objects.create(
            project=project,
            deal=deal,
            name=task_name,
            assigned_to=deal.assigned_to,
            priority='high',
            due_date=due,
        )
