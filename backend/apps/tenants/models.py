from django.db import models
from django_tenants.models import TenantMixin, DomainMixin


class Tenant(TenantMixin):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    plan = models.CharField(max_length=50, default='basic')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    auto_create_schema = True

    def __str__(self):
        return self.name


class Domain(DomainMixin):
    pass
