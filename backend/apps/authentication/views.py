from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, CompanySettings
from .serializers import UserSerializer, UserCreateSerializer, WolfTokenObtainPairSerializer, CompanySettingsSerializer
from .permissions import IsOwnerOrAdmin


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = WolfTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({'detail': 'Sesión cerrada correctamente.'})


class UserListCreateView(generics.ListCreateAPIView):
    def get_queryset(self):
        return User.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrAdmin()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response({'detail': 'No podés desactivar tu propia cuenta.'}, status=400)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'detail': 'Usuario desactivado.'}, status=200)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class CompanySettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CompanySettingsSerializer(
            CompanySettings.get_default(), context={'request': request}
        )
        return Response(serializer.data)

    def patch(self, request):
        if request.user.role not in ['owner', 'admin', 'admin_usuario']:
            return Response({'detail': 'Sin permiso.'}, status=403)
        settings = CompanySettings.get_default()
        serializer = CompanySettingsSerializer(
            settings, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
