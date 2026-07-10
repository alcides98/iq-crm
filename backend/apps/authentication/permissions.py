from rest_framework.permissions import BasePermission

ADMIN_ROLES = ['owner', 'admin', 'admin_usuario']


class IsOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ADMIN_ROLES


class IsAssignedOrOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in ADMIN_ROLES:
            return True
        return getattr(obj, 'assigned_to', None) == request.user
