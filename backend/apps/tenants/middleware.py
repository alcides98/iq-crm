from django.db import connection
from django.http import JsonResponse


class TenantHeaderMiddleware:
    """
    Identifica el tenant por el header HTTP 'X-Tenant' (slug del tenant).
    Permite multi-tenancy sin subdominios, compatible con Render.com.

    El frontend de cada empresa envía X-Tenant: wolfcg o X-Tenant: insight
    configurado vía VITE_TENANT_SLUG en sus variables de entorno de Render.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Siempre empezar desde el schema público para poder leer la tabla de tenants
        connection.set_schema_to_public()

        tenant_slug = request.headers.get('X-Tenant', '').strip()

        if tenant_slug:
            from apps.tenants.models import Tenant
            try:
                tenant = Tenant.objects.get(slug=tenant_slug, is_active=True)
                connection.set_tenant(tenant)
            except Tenant.DoesNotExist:
                return JsonResponse(
                    {'error': f"Tenant '{tenant_slug}' no encontrado o inactivo"},
                    status=404,
                )

        return self.get_response(request)
