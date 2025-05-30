# Generated by Django 5.1.7 on 2025-03-19 16:12

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('fabric', '0004_remove_fabric_category_remove_fabric_supplier_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='CuttingRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(default=django.utils.timezone.now)),
                ('description', models.TextField(blank=True, null=True)),
                ('total_color', models.IntegerField(blank=True, null=True)),
                ('total_size', models.IntegerField(blank=True, null=True)),
                ('total_quantity', models.IntegerField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='CuttingRecordFabric',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('yard_usage', models.DecimalField(decimal_places=2, max_digits=10)),
                ('size', models.CharField(blank=True, max_length=5, null=True)),
                ('quantity_cut', models.IntegerField(blank=True, null=True)),
                ('cuttingrecord', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fabric_lines', to='cutting.cuttingrecord')),
                ('fabric_variant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='fabric.fabricvariant')),
            ],
        ),
    ]
