"""
WSGI config for PythonAnywhere deployment.

This file contains the WSGI application used by PythonAnywhere's WSGI server.
"""

import os
import sys

# Add your project directory to the sys.path
path = '/home/vinukatashidu/pri-fashion'
if path not in sys.path:
    sys.path.append(path)

# Add the project's app directory to the Python path
sys.path.append('/home/vinukatashidu/pri-fashion/backend')

# Set environment variable to use production settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_prod')

# Import and create the WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
