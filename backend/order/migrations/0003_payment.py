# Generated by Django 5.1.7 on 2025-05-06 11:50

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('order', '0002_add_delivery_and_payment_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('payment_method', models.CharField(choices=[('cash', 'Cash'), ('check', 'Check'), ('bank_transfer', 'Bank Transfer'), ('credit', 'Credit (Pay Later)'), ('advance', 'Advance Payment')], max_length=20)),
                ('payment_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('notes', models.TextField(blank=True)),
                ('check_number', models.CharField(blank=True, max_length=50)),
                ('check_date', models.DateField(blank=True, null=True)),
                ('bank_name', models.CharField(blank=True, max_length=100)),
                ('credit_term_months', models.PositiveIntegerField(default=0)),
                ('payment_due_date', models.DateField(blank=True, null=True)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='order.order')),
            ],
        ),
    ]
