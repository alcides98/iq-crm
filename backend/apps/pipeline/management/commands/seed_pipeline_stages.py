from django.core.management.base import BaseCommand
from apps.pipeline.models import PipelineStage

DEFAULT_STAGES = [
    {'name': 'Nueva',                'slug': 'nueva',       'color': 'blue',   'probability': 10,  'order': 1, 'is_active': True, 'is_terminal': False, 'is_won': False},
    {'name': 'Diagnóstico',          'slug': 'diagnostico', 'color': 'amber',  'probability': 30,  'order': 2, 'is_active': True, 'is_terminal': False, 'is_won': False},
    {'name': 'Propuesta',            'slug': 'propuesta',   'color': 'orange', 'probability': 60,  'order': 3, 'is_active': True, 'is_terminal': False, 'is_won': False},
    {'name': 'Replanteo',            'slug': 'replanteo',   'color': 'purple', 'probability': 75,  'order': 4, 'is_active': True, 'is_terminal': False, 'is_won': False},
    {'name': 'Negociación Perdida',  'slug': 'perdida',     'color': 'red',    'probability': 0,   'order': 5, 'is_active': True, 'is_terminal': True,  'is_won': False},
    {'name': 'Negociación Ganada',   'slug': 'ganada',      'color': 'green',  'probability': 100, 'order': 6, 'is_active': True, 'is_terminal': True,  'is_won': True},
]


class Command(BaseCommand):
    help = 'Seed default IQ-CRM pipeline stages for the current tenant schema'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0
        for stage_data in DEFAULT_STAGES:
            obj, created = PipelineStage.objects.get_or_create(
                slug=stage_data['slug'],
                defaults=stage_data,
            )
            if created:
                created_count += 1
            else:
                # Update name/color/probability if it already exists but has different values
                changed = False
                for field in ('name', 'color', 'probability', 'order', 'is_terminal', 'is_won'):
                    if getattr(obj, field) != stage_data[field]:
                        setattr(obj, field, stage_data[field])
                        changed = True
                if changed:
                    obj.save()
                    updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Pipeline stages seeded: {created_count} created, {updated_count} updated, '
            f'{len(DEFAULT_STAGES) - created_count - updated_count} unchanged.'
        ))
