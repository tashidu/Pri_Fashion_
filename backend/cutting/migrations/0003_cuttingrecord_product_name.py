# Generated by Django 5.1.7 on 2025-03-29 11:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cutting', '0002_rename_date_cuttingrecord_cutting_date_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='cuttingrecord',
            name='product_name',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
