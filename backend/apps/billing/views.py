from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import date

from .models import Payment, Installment, Factura, PagoFactura, Egreso, PagoEgreso
from .serializers import (
    PaymentSerializer, InstallmentSerializer,
    FacturaSerializer, PagoFacturaSerializer,
    EgresoSerializer, PagoEgresoSerializer,
)
from apps.authentication.permissions import IsOwnerOrAdmin


# ─── Factura ──────────────────────────────────────────────────────────────────

class FacturaListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = FacturaSerializer

    def get_queryset(self):
        qs = Factura.objects.select_related('client', 'created_by').prefetch_related('pagos')
        estado      = self.request.query_params.get('estado')
        client      = self.request.query_params.get('client')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if estado:
            qs = qs.filter(estado=estado)
        if client:
            qs = qs.filter(client_id=client)
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)
        # Ordenar primero por nombre de cliente, luego por fecha más reciente
        return qs.order_by('client__company_name', '-fecha', '-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class FacturaDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    queryset = Factura.objects.select_related('client', 'created_by').prefetch_related('pagos')
    serializer_class = FacturaSerializer


class FacturaResumenView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get(self, request):
        qs = Factura.objects.all()
        # Aplicar los mismos filtros que la lista
        estado      = request.query_params.get('estado')
        client      = request.query_params.get('client')
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        if estado:
            qs = qs.filter(estado=estado)
        if client:
            qs = qs.filter(client_id=client)
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)

        total     = qs.aggregate(t=Sum('monto'))['t'] or 0
        cobrado   = qs.filter(estado='cobrado').aggregate(t=Sum('monto'))['t'] or 0
        pendiente = qs.filter(estado__in=['pendiente', 'facturado', 'parcial']).aggregate(t=Sum('monto'))['t'] or 0
        vencidas  = qs.filter(
            estado__in=['pendiente', 'facturado', 'parcial'],
            fecha_vencimiento__lt=date.today()
        ).count()
        return Response({
            'total_facturado': int(total),
            'total_cobrado':   int(cobrado),
            'total_pendiente': int(pendiente),
            'count_total':     qs.count(),
            'count_cobrado':   qs.filter(estado='cobrado').count(),
            'count_pendiente': qs.filter(estado__in=['pendiente', 'facturado', 'parcial']).count(),
            'count_vencidas':  vencidas,
        })


# ─── PagoFactura ──────────────────────────────────────────────────────────────

class PagoFacturaListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = PagoFacturaSerializer

    def get_queryset(self):
        return PagoFactura.objects.filter(factura_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        factura = Factura.objects.get(pk=self.kwargs['pk'])
        pago = serializer.save(factura=factura)
        _recalculate_factura(factura)


class PagoFacturaDetailView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    queryset = PagoFactura.objects.select_related('factura')

    def perform_destroy(self, instance):
        factura = instance.factura
        instance.delete()
        _recalculate_factura(factura)


def _recalculate_factura(factura):
    total_pagado = factura.pagos.aggregate(t=Sum('monto'))['t'] or 0
    if total_pagado >= factura.monto:
        factura.estado = 'cobrado'
        if not factura.fecha_cobro:
            factura.fecha_cobro = date.today()
    elif total_pagado > 0:
        factura.estado = 'parcial'
        factura.fecha_cobro = None
    # Si no hay pagos, se deja el estado actual (no revertir a facturado/pendiente)
    factura.save(update_fields=['estado', 'fecha_cobro'])


# ─── Egreso ───────────────────────────────────────────────────────────────────

class EgresoListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = EgresoSerializer

    def get_queryset(self):
        qs = Egreso.objects.select_related('created_by').prefetch_related('pagos')
        estado = self.request.query_params.get('estado')
        categoria = self.request.query_params.get('categoria')
        if estado:
            qs = qs.filter(estado=estado)
        if categoria:
            qs = qs.filter(categoria=categoria)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EgresoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    queryset = Egreso.objects.select_related('created_by').prefetch_related('pagos')
    serializer_class = EgresoSerializer


class EgresoResumenView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get(self, request):
        qs = Egreso.objects.all()
        total = qs.aggregate(t=Sum('monto'))['t'] or 0
        pagado = qs.filter(estado='pagado').aggregate(t=Sum('monto'))['t'] or 0
        pendiente = qs.filter(estado__in=['pendiente', 'parcial']).aggregate(t=Sum('monto'))['t'] or 0
        vencidas = qs.filter(
            estado__in=['pendiente', 'parcial'],
            fecha_vencimiento__lt=date.today()
        ).count()
        return Response({
            'total_egresado': int(total),
            'total_pagado': int(pagado),
            'total_pendiente': int(pendiente),
            'count_total': qs.count(),
            'count_pagado': qs.filter(estado='pagado').count(),
            'count_pendiente': qs.filter(estado__in=['pendiente', 'parcial']).count(),
            'count_vencidas': vencidas,
        })


# ─── PagoEgreso ───────────────────────────────────────────────────────────────

class PagoEgresoListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = PagoEgresoSerializer

    def get_queryset(self):
        return PagoEgreso.objects.filter(egreso_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        egreso = Egreso.objects.get(pk=self.kwargs['pk'])
        serializer.save(egreso=egreso)
        _recalculate_egreso(egreso)


class PagoEgresoDetailView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    queryset = PagoEgreso.objects.select_related('egreso')

    def perform_destroy(self, instance):
        egreso = instance.egreso
        instance.delete()
        _recalculate_egreso(egreso)


def _recalculate_egreso(egreso):
    total_pagado = egreso.pagos.aggregate(t=Sum('monto'))['t'] or 0
    if total_pagado >= egreso.monto:
        egreso.estado = 'pagado'
    elif total_pagado > 0:
        egreso.estado = 'parcial'
    else:
        egreso.estado = 'pendiente'
    egreso.save(update_fields=['estado'])


# ─── Payment / Installment ────────────────────────────────────────────────────

class PaymentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.select_related('deal', 'deal__client').all()

    def perform_create(self, serializer):
        payment = serializer.save()
        _auto_generate_installments(payment)


class PaymentDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class InstallmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = InstallmentSerializer

    def get_queryset(self):
        return Installment.objects.filter(payment_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        serializer.save(payment_id=self.kwargs['pk'])


class InstallmentDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    queryset = Installment.objects.select_related('payment').all()
    serializer_class = InstallmentSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        _recalculate_payment(instance.payment)


def _auto_generate_installments(payment):
    count = max(payment.installments_count, 1)
    per_inst = int(payment.total_amount) // count
    remainder = int(payment.total_amount) - per_inst * count
    today = timezone.now().date()
    for i in range(count):
        amount = per_inst + (remainder if i == 0 else 0)
        Installment.objects.create(
            payment=payment,
            number=i + 1,
            amount=amount,
            due_date=today + timezone.timedelta(days=30 * i),
        )


def _recalculate_payment(payment):
    installments = payment.installments.all()
    paid_total = installments.filter(status='paid').aggregate(t=Sum('amount'))['t'] or 0
    payment.paid_amount = paid_total
    total_count = installments.count()
    paid_count = installments.filter(status='paid').count()
    overdue_count = installments.filter(status='overdue').count()
    if total_count == 0 or (paid_count == 0 and overdue_count == 0):
        payment.status = 'pending'
    elif paid_count == total_count:
        payment.status = 'paid'
    elif overdue_count > 0:
        payment.status = 'overdue'
    else:
        payment.status = 'partial'
    payment.save(update_fields=['paid_amount', 'status'])
