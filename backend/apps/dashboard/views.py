from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Count, F, ExpressionWrapper, FloatField
from django.utils import timezone


class KPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.pipeline.models import Deal
        from apps.tasks.models import Task
        from apps.billing.models import Installment

        user = request.user
        deal_qs = Deal.objects.all()
        task_qs = Task.objects.all()

        if user.role == 'collaborator':
            deal_qs = deal_qs.filter(assigned_to=user)
            task_qs = task_qs.filter(assigned_to=user)

        # Filtros opcionales vía query params
        assigned_to_filter = request.query_params.get('assigned_to')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        if assigned_to_filter:
            deal_qs = deal_qs.filter(assigned_to=assigned_to_filter)
            task_qs = task_qs.filter(assigned_to=assigned_to_filter)
        if date_from:
            deal_qs = deal_qs.filter(created_at__date__gte=date_from)
            task_qs = task_qs.filter(created_at__date__gte=date_from)
        if date_to:
            deal_qs = deal_qs.filter(created_at__date__lte=date_to)
            task_qs = task_qs.filter(created_at__date__lte=date_to)

        active_deals = deal_qs.exclude(phase__in=['ganada', 'perdida'])
        won_deals = deal_qs.filter(phase='ganada')

        pipeline_total = active_deals.aggregate(total=Sum('amount'))['total'] or 0

        forecast = active_deals.aggregate(
            forecast=Sum(
                ExpressionWrapper(F('amount') * F('probability') / 100, output_field=FloatField())
            )
        )['forecast'] or 0

        total_deals = deal_qs.count()
        won_count = won_deals.count()
        conversion_rate = round(won_count / total_deals * 100, 1) if total_deals > 0 else 0

        avg_ticket = won_deals.aggregate(avg=Avg('amount'))['avg'] or 0

        today = timezone.now().date()
        overdue_tasks = task_qs.filter(
            due_date__lt=today,
            status__in=['pending', 'in_progress'],
        ).count()

        pending_billing = Installment.objects.filter(
            status__in=['pending', 'overdue'],
        ).aggregate(total=Sum('amount'))['total'] or 0

        deals_by_phase = list(
            active_deals.values('phase').annotate(count=Count('id'), total=Sum('amount'))
        )

        services_ranking = list(
            won_deals.values('service_type').annotate(
                count=Count('id'), total=Sum('amount')
            ).order_by('-total')[:5]
        )

        source_ranking = list(
            won_deals.values('client__source').annotate(
                count=Count('id')
            ).order_by('-count')[:5]
        )

        deals_by_phase_count = list(
            deal_qs.values('phase').annotate(count=Count('id')).order_by('-count')
        )

        tasks_by_client = list(
            task_qs.exclude(status='cancelled')
            .filter(deal__client__isnull=False)
            .values('deal__client__company_name')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        tasks_by_user = list(
            task_qs.exclude(status='cancelled')
            .filter(assigned_to__isnull=False)
            .values('assigned_to__id', 'assigned_to__first_name', 'assigned_to__last_name')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        return Response({
            'pipeline_total': pipeline_total,
            'forecast_weighted': round(forecast),
            'conversion_rate': conversion_rate,
            'avg_ticket': round(avg_ticket),
            'active_deals_count': active_deals.count(),
            'won_deals_count': won_count,
            'overdue_tasks_count': overdue_tasks,
            'pending_billing': pending_billing,
            'deals_by_phase': deals_by_phase,
            'deals_by_phase_count': deals_by_phase_count,
            'services_ranking': services_ranking,
            'source_ranking': source_ranking,
            'tasks_by_client': tasks_by_client,
            'tasks_by_user': tasks_by_user,
        })


class AlertsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.pipeline.models import Deal
        from apps.tasks.models import Task
        from apps.billing.models import Installment

        user = request.user
        today = timezone.now().date()
        tomorrow = today + timezone.timedelta(days=1)
        in_3 = today + timezone.timedelta(days=3)

        is_admin = user.role in ['owner', 'admin', 'admin_usuario']
        deal_filter = {} if is_admin else {'assigned_to': user}
        task_filter = {} if is_admin else {'assigned_to': user}

        alerts = []

        # Tareas vencidas — con detalle
        overdue_qs = Task.objects.filter(
            due_date__lt=today,
            status__in=['pending', 'in_progress'],
            **task_filter,
        ).select_related('deal', 'project').order_by('due_date')[:10]

        if overdue_qs.exists():
            items = []
            for t in overdue_qs:
                linked = t.deal.name if t.deal else (t.project.name if t.project else None)
                items.append({
                    'id': t.id,
                    'name': t.name,
                    'linked_name': linked,
                    'due_date': str(t.due_date),
                })
            alerts.append({
                'type': 'overdue_tasks',
                'count': len(items),
                'message': f'{len(items)} tarea(s) vencida(s)',
                'items': items,
                'url': '/tasks',
            })

        # Seguimientos hoy/mañana — con detalle
        followup_qs = Deal.objects.filter(
            next_followup__in=[today, tomorrow],
            phase__in=['nueva', 'diagnostico', 'propuesta', 'replanteo'],
            **deal_filter,
        ).select_related('client').order_by('next_followup')[:10]

        if followup_qs.exists():
            items = []
            for d in followup_qs:
                items.append({
                    'id': d.id,
                    'name': d.name,
                    'client_name': d.client.company_name if d.client else None,
                    'next_followup': str(d.next_followup),
                    'is_today': d.next_followup == today,
                })
            alerts.append({
                'type': 'followups',
                'count': len(items),
                'message': f'{len(items)} seguimiento(s) hoy o mañana',
                'items': items,
                'url': '/pipeline',
            })

        # Cuotas próximas — con detalle
        installment_qs = Installment.objects.filter(
            due_date__lte=in_3,
            due_date__gte=today,
            status='pending',
        ).select_related('payment__deal').order_by('due_date')[:10]

        if installment_qs.exists():
            items = []
            for inst in installment_qs:
                deal_name = None
                if inst.payment and inst.payment.deal:
                    deal_name = inst.payment.deal.name
                items.append({
                    'id': inst.id,
                    'number': inst.number,
                    'amount': str(inst.amount),
                    'due_date': str(inst.due_date),
                    'deal_name': deal_name,
                    'is_today': inst.due_date == today,
                })
            alerts.append({
                'type': 'installments_due',
                'count': len(items),
                'message': f'{len(items)} cuota(s) vencen en los próximos 3 días',
                'items': items,
                'url': '/billing',
            })

        return Response({'alerts': alerts, 'total': len(alerts)})
