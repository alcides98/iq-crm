from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import date

from .models import Payment, Installment, Factura, PagoFactura, Egreso, PagoEgreso

MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
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

        total_facturado = qs.aggregate(t=Sum('monto'))['t'] or 0
        # Total realmente cobrado = suma de todos los pagos registrados en esas facturas
        total_cobrado = PagoFactura.objects.filter(factura__in=qs).aggregate(t=Sum('monto'))['t'] or 0
        # Saldo pendiente real = lo facturado menos lo ya cobrado (evita contar monto completo en parciales)
        total_pendiente = total_facturado - total_cobrado
        vencidas = qs.filter(
            estado__in=['pendiente', 'facturado', 'parcial'],
            fecha_vencimiento__lt=date.today()
        ).count()
        return Response({
            'total_facturado': int(total_facturado),
            'total_cobrado':   int(total_cobrado),
            'total_pendiente': int(total_pendiente),
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
        total_egresado = qs.aggregate(t=Sum('monto'))['t'] or 0
        # Total realmente pagado = suma de todos los pagos registrados
        total_pagado = PagoEgreso.objects.filter(egreso__in=qs).aggregate(t=Sum('monto'))['t'] or 0
        # Saldo pendiente real = egresado menos lo ya pagado
        total_pendiente = total_egresado - total_pagado
        vencidas = qs.filter(
            estado__in=['pendiente', 'parcial'],
            fecha_vencimiento__lt=date.today()
        ).count()
        return Response({
            'total_egresado':  int(total_egresado),
            'total_pagado':    int(total_pagado),
            'total_pendiente': int(total_pendiente),
            'count_total':     qs.count(),
            'count_pagado':    qs.filter(estado='pagado').count(),
            'count_pendiente': qs.filter(estado__in=['pendiente', 'parcial']).count(),
            'count_vencidas':  vencidas,
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


# ─── Consolidado ─────────────────────────────────────────────────────────────

class ConsolidadoView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get(self, request):
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        # Bruto: todas las facturas y egresos sin importar estado de pago
        f_qs = Factura.objects.select_related('client')
        e_qs = Egreso.objects.all()
        if fecha_desde:
            f_qs = f_qs.filter(fecha__gte=fecha_desde)
            e_qs = e_qs.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            f_qs = f_qs.filter(fecha__lte=fecha_hasta)
            e_qs = e_qs.filter(fecha__lte=fecha_hasta)

        total_bruto_ingresos = int(f_qs.aggregate(t=Sum('monto'))['t'] or 0)
        total_bruto_egresos  = int(e_qs.aggregate(t=Sum('monto'))['t'] or 0)

        # Cobrado y pagado reales
        total_cobrado = int(PagoFactura.objects.filter(factura__in=f_qs).aggregate(t=Sum('monto'))['t'] or 0)
        total_pagado  = int(PagoEgreso.objects.filter(egreso__in=e_qs).aggregate(t=Sum('monto'))['t'] or 0)

        pct_cobrado = round(total_cobrado / total_bruto_ingresos * 100, 1) if total_bruto_ingresos > 0 else 0
        pct_pagado  = round(total_pagado  / total_bruto_egresos  * 100, 1) if total_bruto_egresos  > 0 else 0

        # Neto sin IVA 10% (monto * 100/110)
        neto_ingresos = round(total_bruto_ingresos * 100 / 110)
        neto_egresos  = round(total_bruto_egresos  * 100 / 110)

        margen_neto = total_bruto_ingresos - total_bruto_egresos
        pct_egreso  = round(total_bruto_egresos / total_bruto_ingresos * 100, 1) if total_bruto_ingresos > 0 else 0

        # IVA 10% incluido: IVA = monto / 11
        iva_ingresos = round(total_bruto_ingresos / 11)
        iva_egresos  = round(total_bruto_egresos  / 11)

        # Top clientes por ingresos (bruto)
        top_clientes = list(
            f_qs.values('client__id', 'client__company_name')
                .annotate(total=Sum('monto'))
                .order_by('-total')[:10]
        )

        # Top egresos por proveedor (bruto)
        top_proveedores = list(
            e_qs.values('proveedor', 'categoria')
                .annotate(total=Sum('monto'))
                .order_by('-total')[:10]
        )

        # Evolución mensual — últimos 12 meses (por fecha de factura/egreso)
        today = date.today()
        evolucion = []
        for i in range(11, -1, -1):
            mes  = (today.month - 1 - i) % 12 + 1
            anio = today.year + ((today.month - 1 - i) // 12)
            ing = int(f_qs.filter(fecha__year=anio, fecha__month=mes).aggregate(t=Sum('monto'))['t'] or 0)
            egr = int(e_qs.filter(fecha__year=anio, fecha__month=mes).aggregate(t=Sum('monto'))['t'] or 0)
            evolucion.append({
                'mes':      f'{anio}-{mes:02d}',
                'label':    f'{MESES_ES[mes-1]} {str(anio)[2:]}',
                'ingresos': ing,
                'egresos':  egr,
                'margen':   ing - egr,
            })

        # Egresos por categoría (bruto)
        egresos_por_categoria = list(
            e_qs.values('categoria')
                .annotate(total=Sum('monto'))
                .order_by('-total')
        )

        return Response({
            'resumen': {
                'total_bruto_ingresos': total_bruto_ingresos,
                'total_bruto_egresos':  total_bruto_egresos,
                'neto_ingresos':        neto_ingresos,
                'neto_egresos':         neto_egresos,
                'total_cobrado':        total_cobrado,
                'total_pagado':         total_pagado,
                'pct_cobrado':          pct_cobrado,
                'pct_pagado':           pct_pagado,
                'margen_neto':          margen_neto,
                'pct_egreso':           pct_egreso,
            },
            'iva': {
                'iva_ingresos': iva_ingresos,
                'iva_egresos':  iva_egresos,
                'diferencia':   iva_ingresos - iva_egresos,
            },
            'top_clientes': [
                {'id': r['client__id'], 'nombre': r['client__company_name'], 'total': int(r['total'])}
                for r in top_clientes
            ],
            'top_proveedores': [
                {'proveedor': r['proveedor'] or '—', 'categoria': r['categoria'], 'total': int(r['total'])}
                for r in top_proveedores
            ],
            'evolucion_mensual': evolucion,
            'egresos_por_categoria': [
                {'categoria': r['categoria'], 'total': int(r['total'])}
                for r in egresos_por_categoria
            ],
        })


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
