from django.db.models import Q
from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project, Task, ChecklistItem
from .serializers import (
    ProjectSerializer, ProjectListSerializer,
    TaskSerializer, TaskListSerializer, ChecklistItemSerializer,
)


class ProjectListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'client', 'responsible']
    search_fields = ['name', 'client__company_name']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Project.objects.select_related('client', 'responsible')
        if user.role in ('collaborator', 'colaborador'):
            qs = qs.filter(responsible=user) | qs.filter(participants=user)
        return qs.distinct()

    def get_serializer_class(self):
        return ProjectListSerializer if self.request.method == 'GET' else ProjectSerializer


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


def _project_tasks_qs(project):
    """Tasks linked directly to project OR via the same deal."""
    q = Q(project=project)
    if project.deal_id:
        q |= Q(deal_id=project.deal_id)
    return Task.objects.filter(q).distinct()


class ProjectTasksView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        project = get_object_or_404(Project, pk=self.kwargs['pk'])
        return (
            _project_tasks_qs(project)
            .select_related('assigned_to')
            .prefetch_related('checklist_items')
        )

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['pk'])


class TaskListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'project', 'deal']
    search_fields = ['name']
    ordering = ['due_date', '-priority']

    def get_queryset(self):
        user = self.request.user
        if user.role in ('collaborator', 'colaborador'):
            return Task.objects.filter(assigned_to=user)
        return Task.objects.all()

    def get_serializer_class(self):
        return TaskListSerializer if self.request.method == 'GET' else TaskSerializer

    def perform_create(self, serializer):
        """Auto-link task to project when deal is set and deal has a project."""
        deal = serializer.validated_data.get('deal')
        extra = {}
        if deal and not serializer.validated_data.get('project'):
            try:
                extra['project'] = deal.project
            except Exception:
                pass
        serializer.save(**extra)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def perform_update(self, serializer):
        """Auto-link task to project when deal is set and task has no project yet."""
        instance = serializer.instance
        deal = serializer.validated_data.get('deal', instance.deal)
        extra = {}
        if deal and not serializer.validated_data.get('project') and not instance.project:
            try:
                extra['project'] = deal.project
            except Exception:
                pass
        serializer.save(**extra)


class TaskChecklistView(generics.ListCreateAPIView):
    serializer_class = ChecklistItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChecklistItem.objects.filter(task_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        task = get_object_or_404(Task, pk=self.kwargs['pk'])
        serializer.save(task=task)
        task.recalculate_progress()


class ChecklistItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ChecklistItem.objects.all()
    serializer_class = ChecklistItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        item = serializer.save()
        item.task.recalculate_progress()

    def perform_destroy(self, instance):
        task = instance.task
        instance.delete()
        task.recalculate_progress()
