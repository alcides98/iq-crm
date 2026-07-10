from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Invoice
from .serializers import InvoiceSerializer
from .sifen_client import SifenClient
from apps.authentication.permissions import IsOwnerOrAdmin


class InvoiceListCreateView(generics.ListCreateAPIView):
    queryset = Invoice.objects.select_related('client', 'deal').all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsOwnerOrAdmin]


class InvoiceDetailView(generics.RetrieveAPIView):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsOwnerOrAdmin]


class InvoiceSendView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def post(self, request, pk):
        invoice = get_object_or_404(Invoice, pk=pk)
        if invoice.status not in ['draft']:
            return Response({'error': 'Solo se pueden enviar facturas en estado borrador.'}, status=400)

        client = SifenClient()
        try:
            xml = client.generate_de_xml(invoice, invoice.client, [])
            signed = client.sign_xml(xml)
            response = client.send_de(signed)

            invoice.status = 'approved' if response.get('estado') == 'Aprobado' else 'sent'
            invoice.cdc = response.get('cdc', '')
            invoice.sifen_response = response
            invoice.issued_at = timezone.now()
            invoice.save()

            return Response(InvoiceSerializer(invoice).data)
        except Exception as e:
            invoice.status = 'rejected'
            invoice.sifen_response = {'error': str(e)}
            invoice.save(update_fields=['status', 'sifen_response'])
            return Response({'error': str(e)}, status=500)


class InvoiceCancelView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def post(self, request, pk):
        invoice = get_object_or_404(Invoice, pk=pk)
        if invoice.status != 'approved':
            return Response({'error': 'Solo se pueden cancelar facturas aprobadas.'}, status=400)

        motive = request.data.get('motive', 'Cancelación solicitada')
        client = SifenClient()
        try:
            client.cancel_de(invoice.cdc, motive)
            invoice.status = 'cancelled'
            invoice.save(update_fields=['status'])
            return Response(InvoiceSerializer(invoice).data)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class InvoiceKudeView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, pk):
        invoice = get_object_or_404(Invoice, pk=pk)
        if not invoice.cdc:
            return Response({'error': 'La factura no tiene CDC asignado.'}, status=400)

        client = SifenClient()
        pdf_bytes = client.get_kude(invoice.cdc)
        return HttpResponse(pdf_bytes, content_type='application/pdf')
