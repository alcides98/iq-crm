from django.db import migrations, models


DEFAULT_STAGES = [
    {'slug': 'nueva',       'name': 'Nueva Negociación',    'color': 'blue',   'probability': 10,  'order': 1, 'is_terminal': False, 'is_won': False},
    {'slug': 'diagnostico', 'name': 'Diagnóstico',          'color': 'amber',  'probability': 30,  'order': 2, 'is_terminal': False, 'is_won': False},
    {'slug': 'propuesta',   'name': 'Envío de Propuesta',   'color': 'orange', 'probability': 60,  'order': 3, 'is_terminal': False, 'is_won': False},
    {'slug': 'replanteo',   'name': 'Replanteo / Ajustes',  'color': 'purple', 'probability': 75,  'order': 4, 'is_terminal': False, 'is_won': False},
    {'slug': 'perdida',     'name': 'Negociación Perdida',  'color': 'red',    'probability': 0,   'order': 5, 'is_terminal': True,  'is_won': False},
    {'slug': 'ganada',      'name': 'Negociación Ganada',   'color': 'green',  'probability': 100, 'order': 6, 'is_terminal': True,  'is_won': True},
]


def seed_stages(apps, schema_editor):
    PipelineStage = apps.get_model('pipeline', 'PipelineStage')
    for s in DEFAULT_STAGES:
        PipelineStage.objects.get_or_create(slug=s['slug'], defaults=s)


def remove_stages(apps, schema_editor):
    PipelineStage = apps.get_model('pipeline', 'PipelineStage')
    PipelineStage.objects.filter(slug__in=[s['slug'] for s in DEFAULT_STAGES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('pipeline', '0002_deal_amount_nullable_document_link'),
    ]

    operations = [
        migrations.CreateModel(
            name='PipelineStage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('slug', models.CharField(max_length=30)),
                ('color', models.CharField(
                    choices=[
                        ('blue', 'Azul'), ('amber', 'Ámbar'), ('orange', 'Naranja'),
                        ('purple', 'Morado'), ('red', 'Rojo'), ('green', 'Verde'),
                        ('gray', 'Gris'), ('teal', 'Turquesa'), ('pink', 'Rosa'),
                    ],
                    default='blue', max_length=20,
                )),
                ('probability', models.IntegerField(default=10)),
                ('order', models.IntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('is_terminal', models.BooleanField(default=False)),
                ('is_won', models.BooleanField(default=False)),
            ],
            options={
                'verbose_name': 'Etapa del Pipeline',
                'verbose_name_plural': 'Etapas del Pipeline',
                'ordering': ['order'],
            },
        ),
        migrations.RunPython(seed_stages, remove_stages),
    ]
