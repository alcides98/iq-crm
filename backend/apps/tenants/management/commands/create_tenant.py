"""
Management command: create_tenant

Crea un nuevo tenant con su schema aislado y un usuario owner inicial.

Uso:
  python manage.py create_tenant \\
    --slug insight \\
    --name "Insight Analytics" \\
    --admin-email admin@iqdata.com.py \\
    --admin-password <password> \\
    --admin-first-name Alcides \\
    --admin-last-name Cardozo

Genera: schema 'insight' con todas las tablas vacías listas para usar.
"""
import os
from django.core.management.base import BaseCommand, CommandError
from django.db import connection


class Command(BaseCommand):
    help = 'Crea un nuevo tenant con schema aislado y usuario owner'

    def add_arguments(self, parser):
        parser.add_argument('--slug', required=True, help='Slug único del tenant (ej: insight)')
        parser.add_argument('--name', required=True, help='Nombre de la empresa (ej: Insight Analytics)')
        parser.add_argument('--plan', default='basic', help='Plan (default: basic)')
        parser.add_argument('--admin-email', required=True, help='Email del usuario owner')
        parser.add_argument('--admin-password', default=None, help='Password (default: var INITIAL_ADMIN_PASSWORD)')
        parser.add_argument('--admin-first-name', default='Admin')
        parser.add_argument('--admin-last-name', default='User')

    def handle(self, *args, **options):
        from apps.tenants.models import Tenant, Domain
        from django_tenants.utils import schema_context

        slug = options['slug'].lower().replace('-', '_')
        name = options['name']

        connection.set_schema_to_public()

        if Tenant.objects.filter(slug=slug).exists():
            raise CommandError(f"El tenant '{slug}' ya existe.")

        # Crear tenant (auto_create_schema=True crea y migra el schema automáticamente)
        tenant = Tenant.objects.create(
            schema_name=slug,
            name=name,
            slug=slug,
            plan=options['plan'],
            is_active=True,
        )
        self.stdout.write(self.style.SUCCESS(f'✓ Tenant "{name}" creado (schema: {slug})'))

        # Registrar dominio localhost para acceso local en dev
        for local in ['localhost', '127.0.0.1']:
            Domain.objects.get_or_create(
                tenant=tenant, domain=local, defaults={'is_primary': False}
            )

        # Crear usuario owner en el nuevo schema
        admin_email = options['admin_email']
        admin_password = options['admin_password'] or os.environ.get('INITIAL_ADMIN_PASSWORD', '')

        if not admin_password:
            self.stdout.write(self.style.WARNING(
                'No se proporcionó contraseña. Pasá --admin-password o definí INITIAL_ADMIN_PASSWORD.'
            ))
            return

        with schema_context(slug):
            from apps.authentication.models import User
            if not User.objects.filter(email=admin_email).exists():
                User.objects.create_superuser(
                    email=admin_email,
                    password=admin_password,
                    first_name=options['admin_first_name'],
                    last_name=options['admin_last_name'],
                    role='owner',
                )
                self.stdout.write(self.style.SUCCESS(f'✓ Usuario owner creado: {admin_email}'))
            else:
                self.stdout.write(f'  Usuario {admin_email} ya existe en schema {slug}')

        self.stdout.write(self.style.SUCCESS(
            f'\nTenant listo. Para que el frontend lo use, configurá:\n'
            f'  VITE_TENANT_SLUG={slug}\n'
            f'en las variables de entorno de Render del frontend de {name}.'
        ))
