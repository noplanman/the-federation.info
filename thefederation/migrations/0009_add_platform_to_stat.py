# Generated by Django 2.0.3 on 2018-04-22 14:00

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('thefederation', '0008_add_platform_link_to_stat'),
    ]

    operations = [
        migrations.AlterField(
            model_name='stat',
            name='node',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='thefederation.Node'),
        ),
        migrations.AlterField(
            model_name='stat',
            name='platform',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='thefederation.Platform'),
        ),
    ]