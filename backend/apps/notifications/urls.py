from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import NotificationPreference


class NotificationPreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        return Response({
            'overdue_tasks': prefs.overdue_tasks,
            'followup_reminders': prefs.followup_reminders,
            'installment_due': prefs.installment_due,
            'email_enabled': prefs.email_enabled,
        })

    def put(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        for field in ['overdue_tasks', 'followup_reminders', 'installment_due', 'email_enabled']:
            if field in request.data:
                setattr(prefs, field, request.data[field])
        prefs.save()
        return Response({'detail': 'Preferencias actualizadas.'})


urlpatterns = [
    path('preferences/', NotificationPreferenceView.as_view(), name='notification-preferences'),
]
