"""
Management command: init_tenant

Crea el tenant 'wolfcg' en el schema público y migra los datos existentes
del schema public al schema wolfcg (migración one-time al activar multi-tenant).

Idempotente: seguro de ejecutar múltiples veces.
"""
import os
from django.core.management.base import BaseCommand
from django.db import connection


TABLES_TO_MIGRATE = [
    'auth_group', 'auth_permission', 'auth_group_permissions',
    'authentication_user', 'authentication_user_groups', 'authentication_user_user_permissions',
    'clients_client', 'clients_contact',
    'pipeline_deal', 'pipeline_phasetransitionlog',
    'tasks_project', 'tasks_project_participants', 'tasks_task', 'tasks_task_participants',
    'billing_payment', 'billing_installment',
    'billing_factura', 'billing_pagofactura', 'billing_egreso', 'billing_pagoegreso',
    'invoicing_invoice',
    'django_session',
]


class Command(BaseCommand):
    help = 'Crea tenant wolfcg y migra datos existentes al nuevo schema (multi-tenant)'

    def add_arguments(self, parser):
        parser.add_argument('--admin-email', default='acardozo@iqdata.com.py')
        parser.add_argument('--admin-password', default=None)
        parser.add_argument('--skip-data-migration', action='store_true')

    def handle(self, *args, **options):
        from apps.tenants.models import Tenant, Domain

        connection.set_schema_to_public()

        # 1. Crear tenant wolfcg
        tenant, created = Tenant.objects.get_or_create(
            schema_name='wolfcg',
            defaults={'name': 'Wolf Consulting Group', 'slug': 'wolfcg', 'plan': 'basic', 'is_active': True},
        )
        action = 'creado' if created else 'ya existe'
        self.stdout.write(self.style.SUCCESS(f'Tenant wolfcg {action}'))

        # 2. Registrar dominio
        allowed = os.environ.get('ALLOWED_HOSTS', '')
        hosts = [h.strip() for h in allowed.split(',') if h.strip() and h.strip() != '*']
        render_hosts = [h for h in hosts if 'onrender.com' in h]
        domain_name = render_hosts[0] if render_hosts else (hosts[0] if hosts else 'localhost')

        Domain.objects.get_or_create(tenant=tenant, domain=domain_name, defaults={'is_primary': True})
        for local in ['localhost', '127.0.0.1']:
            Domain.objects.get_or_create(tenant=tenant, domain=local, defaults={'is_primary': False})
        self.stdout.write(f'Dominio: {domain_name}')

        # 3. Migrar datos del schema public al schema wolfcg
        if not options['skip_data_migration']:
            self._migrate_data_to_wolfcg()

        # 4. Crear usuario owner inicial
        from django_tenants.utils import schema_context
        admin_email = options['admin_email']
        admin_password = options['admin_password'] or os.environ.get('INITIAL_ADMIN_PASSWORD', '')

        if admin_password:
            with schema_context('wolfcg'):
                from apps.authentication.models import User
                if not User.objects.filter(email=admin_email).exists():
                    User.objects.create_superuser(
                        email=admin_email, password=admin_password,
                        first_name='Alcides', last_name='Cardozo', role='owner',
                    )
                    self.stdout.write(self.style.SUCCESS(f'Usuario owner creado: {admin_email}'))
                else:
                    self.stdout.write(f'Usuario {admin_email} ya existe')

        self.stdout.write(self.style.SUCCESS('init_tenant completado'))

    def _migrate_data_to_wolfcg(self):
        with connection.cursor() as cursor:
            # Verificar si wolfcg ya tiene datos (idempotente)
            try:
                cursor.execute('SELECT COUNT(*) FROM wolfcg.authentication_user')
                if cursor.fetchone()[0] > 0:
                    self.stdout.write('Datos ya presentes en wolfcg — saltando migración')
                    return
            except Exception:
                pass

            # Verificar si hay datos en public para migrar
            try:
                cursor.execute('SELECT COUNT(*) FROM public.authentication_user')
                if cursor.fetchone()[0] == 0:
                    self.stdout.write('No hay datos en public para migrar')
                    return
            except Exception:
                self.stdout.write('Sin tablas legacy en public — schema limpio')
                return

            self.stdout.write('Migrando datos public → wolfcg...')
            cursor.execute("SET session_replication_role = 'replica'")

            for table in TABLES_TO_MIGRATE:
                try:
                    cursor.execute(
                        f'INSERT INTO wolfcg.{table} SELECT * FROM public.{table} ON CONFLICT DO NOTHING'
                    )
                    rows = cursor.rowcount
                    if rows > 0:
                        self.stdout.write(f'  {table}: {rows} filas')
                except Exception as e:
                    self.stdout.write(f'  {table}: {e}')

            # Resetear secuencias de IDs
            for table in TABLES_TO_MIGRATE:
                try:
                    cursor.execute(
                        f"SELECT setval(pg_get_serial_sequence('wolfcg.{table}', 'id'),"
                        f" COALESCE((SELECT MAX(id) FROM wolfcg.{table}), 1))"
                    )
                except Exception:
                    pass

            cursor.execute("SET session_replication_role = 'origin'")
            self.stdout.write(self.style.SUCCESS('Migración completada'))
