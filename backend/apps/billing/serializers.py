from rest_framework import serializers
from .models import Payment, Installment, Factura, PagoFactura, Egreso, PagoEgreso


# ── Factura ───────────────────────────────────────────────────────────────────

class PagoFacturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoFactura
        fields = ['id', 'factura', 'monto', 'fecha', 'metodo', 'notas', 'created_at']
        read_only_fields = ['id', 'factura', 'created_at']


class FacturaSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    dias_atraso = serializers.ReadOnlyField()
    dias_para_vencer = serializers.ReadOnlyField()
    monto_pagado = serializers.ReadOnlyField()
    saldo_pendiente = serializers.ReadOnlyField()
    pagos = PagoFacturaSerializer(many=True, read_only=True)

    class Meta:
        model = Factura
        fields = [
            'id', 'client', 'client_name', 'numero_factura', 'fecha',
            'detalle_servicio', 'monto', 'monto_pagado', 'saldo_pendiente',
            'fecha_vencimiento', 'fecha_cobro', 'estado', 'notas',
            'dias_atraso', 'dias_para_vencer', 'pagos',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_client_name(self, obj):
        return obj.client.company_name if obj.client else None


# ── Egreso ────────────────────────────────────────────────────────────────────

class PagoEgresoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoEgreso
        fields = ['id', 'egreso', 'monto', 'fecha', 'metodo', 'notas', 'created_at']
        read_only_fields = ['id', 'egreso', 'created_at']


class EgresoSerializer(serializers.ModelSerializer):
    monto_pagado = serializers.ReadOnlyField()
    saldo_pendiente = serializers.ReadOnlyField()
    dias_atraso = serializers.ReadOnlyField()
    pagos = PagoEgresoSerializer(many=True, read_only=True)

    class Meta:
        model = Egreso
        fields = [
            'id', 'descripcion', 'proveedor', 'categoria', 'monto',
            'monto_pagado', 'saldo_pendiente', 'fecha', 'fecha_vencimiento',
            'estado', 'notas', 'dias_atraso', 'pagos',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


# ── Payment / Installment ─────────────────────────────────────────────────────

class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = '__all__'
        read_only_fields = ['id', 'alert_sent']


class PaymentSerializer(serializers.ModelSerializer):
    installment_list = InstallmentSerializer(many=True, read_only=True, source='installments')
    pending_amount = serializers.ReadOnlyField()
    deal_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ['id', 'deal', 'deal_name', 'total_amount', 'paid_amount', 'pending_amount',
                  'method', 'status', 'installments_count', 'notes', 'created_at', 'installment_list']
        read_only_fields = ['id', 'created_at']

    def get_deal_name(self, obj):
        return obj.deal.name if obj.deal else None
