from django.urls import path
from .views import ClientListCreateView, ClientDetailView, ClientContactListCreateView, ClientDealsView

urlpatterns = [
    path('', ClientListCreateView.as_view(), name='client-list'),
    path('<int:pk>/', ClientDetailView.as_view(), name='client-detail'),
    path('<int:pk>/contacts/', ClientContactListCreateView.as_view(), name='client-contacts'),
    path('<int:pk>/deals/', ClientDealsView.as_view(), name='client-deals'),
]
