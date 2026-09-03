"""
Seed de datos iniciales del pipeline.
Sin multi-tenant: se ejecuta en la primera migracion via management command
o en el primer arrange de datos de la app.
"""

DEFAULT_STAGES = [
    {'name': 'Nueva',               'slug': 'nueva',       'color': 'blue',   'probability': 10,  'order': 1, 'is_active': True, 'is_terminal': False, 'is_won': False},
    {'name': 'Diagnóstico',         'slug': 'diagnostico', 'color': 'amber',  'probability': 30,  'order': 2, 'is_active': True, 'is_terminal': False, 'is_won': False},
    {'name': 'Propuesta',           'slug': 'propuesta',   'color': 'orange', 'probability': 60,  'order': 3, 'is_active': True, 'is_terminal': False, 'is_won': False},
    {'name': 'Replanteo',           'slug': 'replanteo',   'color': 'purple', 'probability': 75,  'order': 4, 'is_active': True, 'is_terminal': False, 'is_won': False},
    {'name': 'Negociación Perdida', 'slug': 'perdida',     'color': 'red',    'probability': 0,   'order': 5, 'is_active': True, 'is_terminal': True,  'is_won': False},
    {'name': 'Negociación Ganada',  'slug': 'ganada',      'color': 'green',  'probability': 100, 'order': 6, 'is_active': True, 'is_terminal': True,  'is_won': True},
]


def seed_pipeline_stages():
    """Inserta las etapas default del pipeline si no existen."""
    try:
        from apps.pipeline.models import PipelineStage
        for stage_data in DEFAULT_STAGES:
            PipelineStage.objects.get_or_create(
                slug=stage_data['slug'],
                defaults=stage_data,
            )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f'Could not seed pipeline stages: {e}')
