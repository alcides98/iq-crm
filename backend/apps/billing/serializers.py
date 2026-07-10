from rest_framework import serializers
from .models import Payment, Installment


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
