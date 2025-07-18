#!/usr/bin/env python3
import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Setup Django
django.setup()

from authentication.models import CustomUser, Role

print('=== ROLES ===')
for role in Role.objects.all():
    print(f'Role: {role.name}')

print('\n=== USERS ===')
for user in CustomUser.objects.all():
    print(f'Username: {user.username}, Role: {user.role.name if user.role else "No Role"}')
