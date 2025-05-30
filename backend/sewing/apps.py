# sewing/apps.py
from django.apps import AppConfig

class SewingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sewing'

    def ready(self):
        import sewing.signals
