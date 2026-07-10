from django.db import migrations, models
class Migration(migrations.Migration):
    dependencies = [('authentication', '0002_companysettings_user_roles')]
    operations = [
        migrations.AddField(model_name='companysettings', name='logo', field=models.ImageField(blank=True, null=True, upload_to='company_logos/', verbose_name='Logo')),
    ]
