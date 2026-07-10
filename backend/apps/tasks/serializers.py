from rest_framework import serializers
from .models import Project, Task, ChecklistItem


class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ['id', 'task', 'text', 'is_done', 'order', 'created_at']
        read_only_fields = ['id', 'created_at', 'task']


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    deal_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    checklist_items = ChecklistItemSerializer(many=True, read_only=True)
    checklist_total = serializers.SerializerMethodField()
    checklist_done = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'alert_sent']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.full_name if obj.assigned_to else None

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_client_name(self, obj):
        if obj.project and obj.project.client:
            return obj.project.client.company_name
        if obj.deal and obj.deal.client:
            return obj.deal.client.company_name
        return None

    def get_deal_name(self, obj):
        return obj.deal.name if obj.deal else None

    def get_checklist_total(self, obj):
        return obj.checklist_items.count()

    def get_checklist_done(self, obj):
        return obj.checklist_items.filter(is_done=True).count()


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — no nested checklist_items."""
    assigned_to_name = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    deal_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    checklist_total = serializers.SerializerMethodField()
    checklist_done = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'name', 'project', 'project_name', 'deal', 'deal_name',
            'assigned_to', 'assigned_to_name', 'status', 'status_display',
            'priority', 'progress_percent', 'due_date', 'start_date',
            'document_link', 'notes', 'checklist_total', 'checklist_done',
            'created_at', 'updated_at',
        ]

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.full_name if obj.assigned_to else None

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_deal_name(self, obj):
        return obj.deal.name if obj.deal else None

    def get_checklist_total(self, obj):
        return obj.checklist_items.count()

    def get_checklist_done(self, obj):
        return obj.checklist_items.filter(is_done=True).count()


class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskListSerializer(many=True, read_only=True)
    progress = serializers.ReadOnlyField()
    responsible_name = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

    def get_responsible_name(self, obj):
        return obj.responsible.full_name if obj.responsible else None

    def get_client_name(self, obj):
        return obj.client.company_name if obj.client else None


class ProjectListSerializer(serializers.ModelSerializer):
    progress = serializers.ReadOnlyField()
    responsible_name = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()
    tasks_done = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'client', 'client_name', 'status', 'progress',
            'responsible', 'responsible_name', 'start_date', 'end_date',
            'tasks_count', 'tasks_done', 'created_at',
        ]

    def get_responsible_name(self, obj):
        return obj.responsible.full_name if obj.responsible else None

    def get_client_name(self, obj):
        return obj.client.company_name if obj.client else None

    def get_tasks_count(self, obj):
        from django.db.models import Q
        from .models import Task
        q = Q(project=obj)
        if obj.deal_id:
            q |= Q(deal_id=obj.deal_id)
        return Task.objects.filter(q).exclude(status='cancelled').distinct().count()

    def get_tasks_done(self, obj):
        from django.db.models import Q
        from .models import Task
        q = Q(project=obj)
        if obj.deal_id:
            q |= Q(deal_id=obj.deal_id)
        return Task.objects.filter(q).filter(status='completed').distinct().count()
