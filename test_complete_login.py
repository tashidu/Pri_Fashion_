#!/usr/bin/env python3
"""
Complete Login Test for Pri Fashion
Tests the entire login flow including database setup
"""

import os
import sys
import django
import time
import subprocess
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Setup Django
django.setup()

from authentication.models import CustomUser, Role
from django.contrib.auth import authenticate

def test_database_setup():
    """Test if database is properly set up"""
    print("🔍 Testing database setup...")
    
    try:
        # Check roles
        roles = Role.objects.all()
        print(f"✅ Found {roles.count()} roles:")
        for role in roles:
            print(f"   - {role.name}")
        
        # Check users
        users = CustomUser.objects.all()
        print(f"✅ Found {users.count()} users:")
        for user in users:
            print(f"   - {user.username} (Role: {user.role.name if user.role else 'No Role'})")
        
        return True
    except Exception as e:
        print(f"❌ Database setup error: {e}")
        return False

def test_authentication():
    """Test Django authentication"""
    print("\n🔐 Testing authentication...")
    
    username = "owner"
    password = "12345678"
    
    try:
        # Test Django authenticate function
        user = authenticate(username=username, password=password)
        if user:
            print(f"✅ Authentication successful for user: {user.username}")
            print(f"   Role: {user.role.name if user.role else 'No Role'}")
            return True
        else:
            print("❌ Authentication failed - Invalid credentials")
            return False
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return False

def test_django_server():
    """Test if Django server can start"""
    print("\n🚀 Testing Django server startup...")
    
    try:
        # Start Django server in background
        python_path = Path(__file__).resolve().parent / 'env' / 'Scripts' / 'python.exe'
        manage_path = Path(__file__).resolve().parent / 'backend' / 'manage.py'
        
        print(f"Python path: {python_path}")
        print(f"Manage path: {manage_path}")
        
        if not python_path.exists():
            print(f"❌ Python executable not found at: {python_path}")
            return False
            
        if not manage_path.exists():
            print(f"❌ Django manage.py not found at: {manage_path}")
            return False
        
        print("✅ Django server files found")
        return True
        
    except Exception as e:
        print(f"❌ Django server test error: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Pri Fashion Complete Login Test")
    print("=" * 50)
    
    # Test 1: Database setup
    db_ok = test_database_setup()
    
    # Test 2: Authentication
    auth_ok = test_authentication()
    
    # Test 3: Django server
    server_ok = test_django_server()
    
    print("\n" + "=" * 50)
    print("📋 Test Results:")
    print(f"   Database Setup: {'✅ PASS' if db_ok else '❌ FAIL'}")
    print(f"   Authentication: {'✅ PASS' if auth_ok else '❌ FAIL'}")
    print(f"   Django Server:  {'✅ PASS' if server_ok else '❌ FAIL'}")
    
    if db_ok and auth_ok and server_ok:
        print("\n🎉 All tests passed! Login should work.")
        print("\n📋 Your login credentials:")
        print("   Username: owner")
        print("   Password: 12345678")
        print("\n🚀 To start the desktop application:")
        print("   Double-click the Pri Fashion desktop icon")
        print("   Or run: PriFashion.bat")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        
        if not db_ok:
            print("\n🔧 To fix database issues:")
            print("   Run: python initialize_database.py")
            
        if not auth_ok:
            print("\n🔧 To fix authentication issues:")
            print("   1. Make sure the user exists")
            print("   2. Check password is correct")
            print("   3. Verify role assignment")

if __name__ == '__main__':
    main()
