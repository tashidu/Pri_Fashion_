# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('finished_product', '0005_finishedproduct_notes'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(blank=True, null=True, upload_to='product_images/')),
                ('external_url', models.URLField(blank=True, max_length=500, null=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('finished_product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='finished_product.finishedproduct')),
            ],
            options={
                'ordering': ['order'],
            },
        ),
    ]
