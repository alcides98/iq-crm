from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, CompanySettings


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'role', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CompanySettingsSerializer(serializers.ModelSerializer):
    logo_file_url = serializers.SerializerMethodField()
    # Override URLFields with CharField so bare domains like "www.empresa.com" are accepted
    website = serializers.CharField(max_length=500, allow_blank=True, required=False)
    logo_url = serializers.CharField(max_length=500, allow_blank=True, required=False)

    class Meta:
        model = CompanySettings
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_logo_file_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class WolfTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
