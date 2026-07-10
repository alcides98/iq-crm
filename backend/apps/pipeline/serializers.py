from rest_framework import serializers
from .models import Deal, PhaseTransitionLog, PipelineStage


class PipelineStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PipelineStage
        fields = '__all__'


class PhaseTransitionLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PhaseTransitionLog
        fields = '__all__'

    def get_changed_by_name(self, obj):
        return obj.changed_by.full_name if obj.changed_by else None


class DealSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    phase_display = serializers.CharField(source='get_phase_display', read_only=True)
    service_display = serializers.CharField(source='get_service_type_display', read_only=True)

    class Meta:
        model = Deal
        fields = '__all__'
        read_only_fields = ['id', 'probability', 'start_date', 'created_at', 'updated_at', 'created_by']

    def get_client_name(self, obj):
        return obj.client.company_name if obj.client else None

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.full_name if obj.assigned_to else None

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class DealListSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    phase_display = serializers.CharField(source='get_phase_display', read_only=True)
    tasks_count = serializers.SerializerMethodField()
    tasks_done = serializers.SerializerMethodField()
    tasks_progress = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = [
            'id', 'name', 'client', 'client_name', 'service_type', 'phase', 'phase_display',
            'probability', 'amount', 'amount_original', 'priority', 'assigned_to', 'assigned_to_name',
            'next_followup', 'estimated_close_date', 'document_link',
            'tasks_count', 'tasks_done', 'tasks_progress', 'created_at',
        ]

    def get_client_name(self, obj):
        return obj.client.company_name if obj.client else None

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.full_name if obj.assigned_to else None

    def get_tasks_count(self, obj):
        return obj.tasks.exclude(status='cancelled').count()

    def get_tasks_done(self, obj):
        return obj.tasks.filter(status='completed').count()

    def get_tasks_progress(self, obj):
        total = obj.tasks.exclude(status='cancelled').count()
        if total == 0:
            return 0
        done = obj.tasks.filter(status='completed').count()
        return int(done / total * 100)


class DealAdvanceSerializer(serializers.Serializer):
    phase = serializers.ChoiceField(choices=Deal.PHASE_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    initial_need = serializers.CharField(required=False, allow_blank=True)
    next_followup = serializers.DateField(required=False, allow_null=True)
    assigned_to = serializers.IntegerField(required=False, allow_null=True)
    diagnosis_notes = serializers.CharField(required=False, allow_blank=True)
    proposal_link = serializers.URLField(required=False, allow_blank=True)
    amount = serializers.DecimalField(max_digits=15, decimal_places=0, required=False, allow_null=True)
    loss_reason = serializers.CharField(required=False, allow_blank=True)
    actual_close_date = serializers.DateField(required=False, allow_null=True)
    document_link = serializers.URLField(required=False, allow_blank=True)
