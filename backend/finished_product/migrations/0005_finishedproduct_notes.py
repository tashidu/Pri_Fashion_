# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finished_product', '0004_finishedproduct_product_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='finishedproduct',
            name='notes',
            field=models.TextField(blank=True, null=True),
        ),
    ]
