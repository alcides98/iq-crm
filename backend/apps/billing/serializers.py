from rest_framework import serializers
from .models import Payment, Installment, Factura


class FacturaSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    dias_atraso = serializers.ReadOnlyField()
    dias_para_vencer = serializers.ReadOnlyField()

    class Meta:
        model = Factura
        fields = [
            'id', 'client', 'client_name', 'numero_factura', 'fecha',
            'detalle_servicio', 'monto', 'fecha_vencimiento', 'fecha_cobro',
            'estado', 'notas', 'dias_atraso', 'dias_para_vencer',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_client_name(self, obj):
        return obj.client.company_name if obj.client else None


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
