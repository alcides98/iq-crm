"""
Management command: init_tenant
Uso: python manage.py init_tenant

Crea el tenant "wolfcg" (Wolf Consulting Group) y su dominio en la base de datos
de produccion si aun no existen. Seguro de ejecutar multiples veces (idempotente).

Se llama automaticamente en el buildCommand de Render despues de migrate_schemas.
"""
import os
from django.core.management.base import BaseCommand
from django_tenants.utils import get_public_schema_name


class Command(BaseCommand):
    help = 'Crea el tenant wolfcg y su dominio si no existen (idempotente)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--domain',
            default=None,
            help='Dominio del backend (default: lee ALLOWED_HOSTS o usa iq-crm-backend.onrender.com)',
        )
        parser.add_argument(
            '--admin-email',
            default='acardozo@iqdata.com.py',
            help='Email del usuario owner inicial',
        )
        parser.add_argument(
            '--admin-password',
            default=None,
            help='Password del usuario owner inicial (default: lee INITIAL_ADMIN_PASSWORD)',
        )

    def handle(self, *args, **options):
        from apps.tenants.models import Tenant, Domain

        # ── 1. Crear tenant wolfcg en schema public ───────────────────────
        tenant, created = Tenant.objects.get_or_create(
            schema_name='wolfcg',
            defaults={
                'name': 'Wolf Consulting Group',
                'slug': 'wolfcg',
                'plan': 'basic',
                'is_active': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Tenant wolfcg creado'))
        else:
            self.stdout.write('Tenant wolfcg ya existe — saltando creacion')

        # ── 2. Registrar dominio del backend ──────────────────────────────
        domain_name = options['domain']
        if not domain_name:
            # Intentar inferir desde ALLOWED_HOSTS
            allowed = os.environ.get('ALLOWED_HOSTS', '')
            hosts = [h.strip() for h in allowed.split(',') if h.strip() and h.strip() != '*']
            # Buscar el host de onrender.com primero
            render_hosts = [h for h in hosts if 'onrender.com' in h or 'render.com' in h]
            domain_name = render_hosts[0] if render_hosts else (hosts[0] if hosts else 'iq-crm-backend.onrender.com')

        domain, d_created = Domain.objects.get_or_create(
            tenant=tenant,
            domain=domain_name,
            defaults={'is_primary': True},
        )
        if d_created:
            self.stdout.write(self.style.SUCCESS(f'Dominio registrado: {domain_name}'))
        else:
            self.stdout.write(f'Dominio {domain_name} ya existia')

        # Ademas registrar localhost para no romper acceso local
        for local_host in ['localhost', '127.0.0.1']:
            Domain.objects.get_or_create(
                tenant=tenant,
                domain=local_host,
                defaults={'is_primary': False},
            )

        # ── 3. Crear usuario owner inicial si no existe ───────────────────
        from django_tenants.utils import schema_context
        admin_email = options['admin_email']
        admin_password = options['admin_password'] or os.environ.get('INITIAL_ADMIN_PASSWORD', 'Ac779808.')

        with schema_context('wolfcg'):
            from apps.authentication.models import User
            if not User.objects.filter(email=admin_email).exists():
                User.objects.create_superuser(
                    email=admin_email,
                    password=admin_password,
                    first_name='Alcides',
                    last_name='Cardozo',
                    role='owner',
                )
                self.stdout.write(self.style.SUCCESS(f'Usuario owner creado: {admin_email}'))
            else:
                self.stdout.write(f'Usuario {admin_email} ya existe — saltando creacion')

        self.stdout.write(self.style.SUCCESS('init_tenant completado exitosamente'))
