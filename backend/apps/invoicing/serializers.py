from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    deal_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['id', 'cdc', 'xml_content', 'kude_url', 'sifen_response',
                            'issued_at', 'issued_by', 'created_at']

    def get_client_name(self, obj):
        return obj.client.company_name if obj.client else None

    def get_deal_name(self, obj):
        return obj.deal.name if obj.deal else None

    def create(self, validated_data):
        validated_data['issued_by'] = self.context['request'].user
        return super().create(validated_data)
