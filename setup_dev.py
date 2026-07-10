#!/usr/bin/env python
"""
Script de setup inicial para desarrollo.
Crea el tenant de Wolf Consulting Group y el superusuario.

Ejecutar: python setup_dev.py
(Requiere el entorno virtual activo y la base de datos configurada)
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/backend')

django.setup()

from apps.tenants.models import Tenant, Domain
from apps.authentication.models import User
from django_tenants.utils import schema_context


def create_tenant():
    tenant, created = Tenant.objects.get_or_create(
        schema_name='wolfcg',
        defaults={
            'name': 'Wolf Consulting Group',
            'slug': 'wolfcg',
            'plan': 'basic',
        }
    )
    if created:
        print(f'Tenant creado: {tenant.name}')
    else:
        print(f'Tenant ya existe: {tenant.name}')

    # Dominio principal
    Domain.objects.get_or_create(
        domain='wolfcg.localhost',
        defaults={'tenant': tenant, 'is_primary': True}
    )
    # Dominios para desarrollo local directo
    for dev_domain in ['localhost', '127.0.0.1']:
        Domain.objects.get_or_create(
            domain=dev_domain,
            defaults={'tenant': tenant, 'is_primary': False}
        )
    return tenant


def create_superuser(tenant):
    with schema_context(tenant.schema_name):
        email = 'admin@wolfcg.com'
        if not User.objects.filter(email=email).exists():
            user = User.objects.create_superuser(
                email=email,
                first_name='Admin',
                last_name='Wolf CRM',
                password='wolfcrm2025',
                role='owner',
            )
            print(f'Superusuario creado: {email} / wolfcrm2025')
        else:
            print(f'Superusuario ya existe: {email}')


if __name__ == '__main__':
    print('== Wolf CRM — Setup inicial ==')
    tenant = create_tenant()
    create_superuser(tenant)
    print('Listo. Accedé en: http://localhost:3000')
