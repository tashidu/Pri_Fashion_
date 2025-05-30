# Generated by Django 5.1.6 on 2025-04-15 10:07

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cutting', '0003_cuttingrecord_product_name'),
        ('sewing', '0004_rename_cutting_detail_dailysewingrecord__cuttingrecordfabric'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dailysewingrecord',
            name='_cuttingrecordfabric',
        ),
        migrations.AddField(
            model_name='dailysewingrecord',
            name='cutting_record_fabric',
            field=models.ForeignKey(db_column='cutting_record_fabric_id', default=1, on_delete=django.db.models.deletion.CASCADE, to='cutting.cuttingrecordfabric'),
            preserve_default=False,
        ),
    ]
