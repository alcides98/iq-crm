from django.urls import path
from .views import LoginView, LogoutView, UserListCreateView, UserDetailView, MeView, CompanySettingsView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('users/', UserListCreateView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('company/', CompanySettingsView.as_view(), name='company-settings'),
]
