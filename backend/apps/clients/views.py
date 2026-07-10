from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client, Contact
from .serializers import ClientSerializer, ClientListSerializer, ContactSerializer


class ClientListCreateView(generics.ListCreateAPIView):
    queryset = Client.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'client_type', 'city', 'source']
    search_fields = ['company_name', 'contact_name', 'email', 'phone', 'ruc']
    ordering_fields = ['company_name', 'created_at', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ClientListSerializer
        return ClientSerializer


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer


class ClientContactListCreateView(generics.ListCreateAPIView):
    serializer_class = ContactSerializer

    def get_queryset(self):
        return Contact.objects.filter(client_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        serializer.save(client_id=self.kwargs['pk'])


class ClientDealsView(generics.ListAPIView):
    def get_queryset(self):
        from apps.pipeline.models import Deal
        return Deal.objects.filter(client_id=self.kwargs['pk'])

    def get_serializer_class(self):
        from apps.pipeline.serializers import DealListSerializer
        return DealListSerializer
