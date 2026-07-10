from django.urls import path
from .views import (
    DealListCreateView, DealDetailView, DealAdvanceView, DealLogsView,
    PipelineStageListView, PipelineStageDetailView,
)

urlpatterns = [
    path('deals/', DealListCreateView.as_view(), name='deal-list'),
    path('deals/<int:pk>/', DealDetailView.as_view(), name='deal-detail'),
    path('deals/<int:pk>/advance/', DealAdvanceView.as_view(), name='deal-advance'),
    path('deals/<int:pk>/logs/', DealLogsView.as_view(), name='deal-logs'),
    path('stages/', PipelineStageListView.as_view(), name='pipeline-stage-list'),
    path('stages/<int:pk>/', PipelineStageDetailView.as_view(), name='pipeline-stage-detail'),
]
