# Generated by Django 5.1.6 on 2025-04-15 10:34

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('sewing', '0005_remove_dailysewingrecord__cuttingrecordfabric_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dailysewingrecord',
            name='cutting_record_fabric',
        ),
    ]
