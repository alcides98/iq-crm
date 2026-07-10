from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0002_add_document_link'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChecklistItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.CharField(max_length=300)),
                ('is_done', models.BooleanField(default=False)),
                ('order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('task', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='checklist_items',
                    to='tasks.task',
                )),
            ],
            options={
                'verbose_name': 'Item de checklist',
                'verbose_name_plural': 'Items de checklist',
                'ordering': ['order', 'created_at'],
            },
        ),
    ]
