#!/usr/bin/env python3
"""
Initialize Pri Fashion Database
Creates initial roles and admin user
"""

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

def create_roles():
    """Create the required roles"""
    roles = ['Owner', 'Inventory Manager', 'Order Coordinator', 'Sales Team']
    
    print("Creating roles...")
    for role_name in roles:
        role, created = Role.objects.get_or_create(name=role_name)
        if created:
            print(f"✅ Created role: {role_name}")
        else:
            print(f"ℹ️  Role already exists: {role_name}")

def create_admin_user():
    """Create the admin user with Owner role"""
    username = 'owner'
    password = '12345678'
    
    try:
        # Get the Owner role
        owner_role = Role.objects.get(name='Owner')
        
        # Check if user already exists
        if CustomUser.objects.filter(username=username).exists():
            print(f"ℹ️  User '{username}' already exists")
            # Update the existing user's password and role
            user = CustomUser.objects.get(username=username)
            user.set_password(password)
            user.role = owner_role
            user.save()
            print(f"✅ Updated user '{username}' password and role")
        else:
            # Create new user
            user = CustomUser.objects.create_user(
                username=username,
                password=password
            )
            user.role = owner_role
            user.save()
            print(f"✅ Created admin user: {username}")
            
        print(f"📋 Login credentials:")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        print(f"   Role: Owner")
        
    except Role.DoesNotExist:
        print("❌ Owner role not found. Please create roles first.")
        return False
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False
    
    return True

def main():
    """Main initialization function"""
    print("🚀 Initializing Pri Fashion Database")
    print("=" * 40)
    
    try:
        # Create roles
        create_roles()
        print()
        
        # Create admin user
        create_admin_user()
        print()
        
        print("🎉 Database initialization completed successfully!")
        print()
        print("📋 Next steps:")
        print("1. Start the Django server: start_django.bat")
        print("2. Open the frontend application")
        print("3. Login with username 'owner' and password '12345678'")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        print()
        print("🔧 Troubleshooting:")
        print("1. Make sure MySQL is running")
        print("2. Check database connection settings")
        print("3. Run migrations: python backend/manage.py migrate")
        return False
    
    return True

if __name__ == '__main__':
    main()
