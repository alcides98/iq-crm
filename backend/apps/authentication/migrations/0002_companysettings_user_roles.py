from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CompanySettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='Mi Empresa', max_length=200)),
                ('tagline', models.CharField(blank=True, max_length=300)),
                ('logo_url', models.URLField(blank=True)),
                ('website', models.URLField(blank=True)),
                ('phone', models.CharField(blank=True, max_length=50)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('address', models.CharField(blank=True, max_length=300)),
                ('ruc', models.CharField(blank=True, max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Configuración de empresa',
            },
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('owner', 'Dueño'),
                    ('admin', 'Administrador'),
                    ('admin_usuario', 'Admin Usuario'),
                    ('collaborator', 'Colaborador'),
                    ('colaborador', 'Colaborador'),
                ],
                default='collaborator',
                max_length=20,
            ),
        ),
    ]
