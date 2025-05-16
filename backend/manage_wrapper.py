#!/usr/bin/env python
"""
A wrapper script for manage.py that uses the correct Python path.
"""
import os
import sys
import subprocess
from pathlib import Path
from dotenv import load_dotenv

# Add the project root to the Python path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables
if os.path.exists(os.path.join(project_root, '.env.local')):
    load_dotenv(os.path.join(project_root, '.env.local'))
    print("Loaded .env.local")
elif os.path.exists(os.path.join(project_root, '.env.vm')):
    load_dotenv(os.path.join(project_root, '.env.vm'))
    print("Loaded .env.vm")
else:
    load_dotenv(os.path.join(project_root, '.env'))
    print("Loaded .env")

# Get Python path from environment variable or use the current Python
python_path = os.getenv('PYTHON_PATH', sys.executable)

# Run Django's manage.py directly
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    from django.core.management import execute_from_command_line
except ImportError as exc:
    raise ImportError(
        "Couldn't import Django. Are you sure it's installed and "
        "available on your PYTHONPATH environment variable? Did you "
        "forget to activate a virtual environment?"
    ) from exc

execute_from_command_line(sys.argv)
