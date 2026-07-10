import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/backend')
django.setup()

from apps.tenants.models import Tenant, Domain
t = Tenant.objects.get(slug='wolfcg')
for d in ['localhost', '127.0.0.1']:
    obj, created = Domain.objects.get_or_create(domain=d, defaults={'tenant': t, 'is_primary': False})
    status = 'creado' if created else 'ya existia'
    print(f'  Dominio {d}: {status}')
print('Listo')
