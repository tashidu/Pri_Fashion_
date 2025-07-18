#!/usr/bin/env python3
import requests
import json

def test_login():
    """Test the login endpoint"""
    url = "http://127.0.0.1:8000/api/auth/login/"
    
    # Test credentials
    credentials = {
        "username": "owner",
        "password": "12345678"
    }
    
    try:
        print("🧪 Testing login endpoint...")
        print(f"URL: {url}")
        print(f"Credentials: {credentials}")
        print()
        
        response = requests.post(url, json=credentials, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful!")
            print(f"Access Token: {data.get('access', 'Not found')}")
            print(f"Role: {data.get('role', 'Not found')}")
        else:
            print("❌ Login failed!")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Django server. Make sure it's running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_login()
