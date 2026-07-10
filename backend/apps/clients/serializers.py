from rest_framework import serializers
from .models import Client, Contact


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'
        read_only_fields = ['id']


class ClientSerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None

    def validate_ruc(self, value):
        if value:
            client = Client(ruc=value)
            if not client.validate_ruc():
                raise serializers.ValidationError('RUC inválido — dígito verificador incorrecto.')
        return value

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ClientListSerializer(serializers.ModelSerializer):
    """Serializer liviano para listados"""
    class Meta:
        model = Client
        fields = ['id', 'client_type', 'status', 'company_name', 'contact_name',
                  'phone', 'email', 'city', 'source', 'document_link', 'created_at']
