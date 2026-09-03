"""
Management command: create_initial_admin
Uso: python manage.py create_initial_admin

Crea el usuario owner/admin inicial si no existe ningun usuario en la base
y hace seed de las etapas del pipeline. Idempotente (seguro de re-ejecutar).
Se llama en el buildCommand de Render despues de migrate.
"""
import os
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Crea usuario admin inicial + seed de stages del pipeline (idempotente)'

    def handle(self, *args, **options):
        self._create_admin()
        self._seed_stages()

    def _create_admin(self):
        from apps.authentication.models import User

        if User.objects.exists():
            self.stdout.write('Usuarios ya existen — saltando creacion de admin')
            return

        email = os.environ.get('INITIAL_ADMIN_EMAIL', 'acardozo@iqdata.com.py')
        password = os.environ.get('INITIAL_ADMIN_PASSWORD', 'Ac779808.')

        User.objects.create_superuser(
            email=email,
            password=password,
            first_name='Alcides',
            last_name='Cardozo',
            role='owner',
        )
        self.stdout.write(self.style.SUCCESS(f'Usuario owner creado: {email}'))

    def _seed_stages(self):
        from apps.tenants.signals import seed_pipeline_stages
        seed_pipeline_stages()
        self.stdout.write(self.style.SUCCESS('Pipeline stages seeded'))
