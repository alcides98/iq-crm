from django.urls import path
from .views import (
    ProjectListCreateView, ProjectDetailView, ProjectTasksView,
    TaskListCreateView, TaskDetailView,
    TaskChecklistView, ChecklistItemDetailView,
)

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view(), name='project-list'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:pk>/tasks/', ProjectTasksView.as_view(), name='project-tasks'),
    path('tasks/', TaskListCreateView.as_view(), name='task-list'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:pk>/checklist/', TaskChecklistView.as_view(), name='task-checklist'),
    path('checklist/<int:pk>/', ChecklistItemDetailView.as_view(), name='checklist-item-detail'),
]
