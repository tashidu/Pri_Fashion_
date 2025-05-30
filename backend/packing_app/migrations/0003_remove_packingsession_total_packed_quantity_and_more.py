# Generated by Django 5.1.6 on 2025-04-06 14:53

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finished_product', '0002_finishedproduct_is_provisional_and_more'),
        ('packing_app', '0002_alter_packingsession_total_packed_quantity'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='packingsession',
            name='total_packed_quantity',
        ),
        migrations.AlterField(
            model_name='packingsession',
            name='extra_items',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='packingsession',
            name='number_of_12_packs',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='packingsession',
            name='number_of_6_packs',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.CreateModel(
            name='PackingInventory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('number_of_6_packs', models.PositiveIntegerField(default=0)),
                ('number_of_12_packs', models.PositiveIntegerField(default=0)),
                ('extra_items', models.PositiveIntegerField(default=0)),
                ('finished_product', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='finished_product.finishedproduct')),
            ],
        ),
        migrations.DeleteModel(
            name='PackingDetail',
        ),
    ]
