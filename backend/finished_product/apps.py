from django.apps import AppConfig


class FinishedProductConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finished_product'


def ready(self):
    import finished_product.signals
