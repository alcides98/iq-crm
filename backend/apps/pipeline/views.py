from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import Deal, PhaseTransitionLog, PipelineStage
from .serializers import (
    DealSerializer, DealListSerializer, PhaseTransitionLogSerializer,
    DealAdvanceSerializer, PipelineStageSerializer,
)
from apps.authentication.permissions import IsAssignedOrOwner


REQUIRED_FIELDS_BY_PHASE = {
    'diagnostico': ['initial_need', 'next_followup'],
    'propuesta': ['diagnosis_notes', 'next_followup', 'amount'],
    'replanteo': ['amount', 'next_followup'],
    'perdida': ['loss_reason'],
    'ganada': ['amount', 'actual_close_date'],
}


class DealListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['phase', 'service_type', 'priority', 'assigned_to']
    search_fields = ['name', 'client__company_name']
    ordering_fields = ['amount', 'created_at', 'next_followup', 'probability']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Deal.objects.select_related('client', 'assigned_to')
        if user.role == 'collaborator':
            qs = qs.filter(assigned_to=user)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return DealListSerializer
        return DealSerializer


class DealDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Deal.objects.all()
    serializer_class = DealSerializer

    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticated
        return [IsAuthenticated(), IsAssignedOrOwner()]


class DealAdvanceView(APIView):
    def post(self, request, pk):
        deal = get_object_or_404(Deal, pk=pk)
        serializer = DealAdvanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        target_phase = data['phase']

        missing = self._validate_required(deal, data, target_phase)
        if missing:
            return Response({
                'error': 'Campos obligatorios incompletos',
                'missing_fields': missing,
                'message': f'Completá los campos requeridos para avanzar a {target_phase}',
            }, status=status.HTTP_400_BAD_REQUEST)

        old_phase = deal.phase
        deal.phase = target_phase

        # Al pasar a Replanteo: guardar el monto original antes de modificarlo
        if target_phase == 'replanteo' and not deal.amount_original and deal.amount is not None:
            deal.amount_original = deal.amount

        # Actualizar campos enviados
        for field in ['initial_need', 'next_followup', 'diagnosis_notes',
                      'proposal_link', 'amount', 'loss_reason', 'actual_close_date',
                      'document_link']:
            if field in data and data[field] is not None:
                setattr(deal, field, data[field])

        if 'assigned_to' in data and data['assigned_to']:
            from apps.authentication.models import User
            try:
                deal.assigned_to = User.objects.get(pk=data['assigned_to'])
            except User.DoesNotExist:
                pass

        deal.save()

        PhaseTransitionLog.objects.create(
            deal=deal,
            from_phase=old_phase,
            to_phase=target_phase,
            changed_by=request.user,
            notes=data.get('notes', ''),
        )

        self._trigger_automations(deal, target_phase)

        return Response(DealSerializer(deal, context={'request': request}).data)

    def _validate_required(self, deal, data, target_phase):
        required = REQUIRED_FIELDS_BY_PHASE.get(target_phase, [])
        missing = []
        for field in required:
            value = data.get(field) or getattr(deal, field, None)
            if not value:
                missing.append(field)
        return missing

    def _trigger_automations(self, deal, phase):
        try:
            from apps.notifications.tasks import schedule_followup_reminder
            from apps.tasks.tasks import create_project_from_deal

            if phase == 'propuesta':
                schedule_followup_reminder.apply_async(args=[deal.id], countdown=48 * 3600)
            elif phase == 'ganada':
                create_project_from_deal.delay(deal.id)
        except Exception:
            pass


class DealLogsView(generics.ListAPIView):
    serializer_class = PhaseTransitionLogSerializer

    def get_queryset(self):
        return PhaseTransitionLog.objects.filter(deal_id=self.kwargs['pk'])


class PipelineStageListView(generics.ListCreateAPIView):
    queryset = PipelineStage.objects.all()
    serializer_class = PipelineStageSerializer


class PipelineStageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PipelineStage.objects.all()
    serializer_class = PipelineStageSerializer
