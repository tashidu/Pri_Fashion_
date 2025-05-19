#!/usr/bin/env python
"""
Deployment verification script for Pri Fashion

This script checks if the deployed backend is accessible and responding correctly.
"""

import sys
import requests
import time
import argparse

def check_backend(url, max_retries=5, retry_delay=5):
    """Check if the backend is accessible and responding correctly."""
    print(f"Checking backend at {url}...")
    
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(f"{url}/api/auth/health/", timeout=10)
            if response.status_code == 200:
                print(f"✅ Backend is up and running! Response: {response.json()}")
                return True
            else:
                print(f"❌ Backend returned status code {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Attempt {attempt}/{max_retries} failed: {str(e)}")
        
        if attempt < max_retries:
            print(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    
    print("❌ Backend verification failed after multiple attempts")
    return False

def main():
    parser = argparse.ArgumentParser(description="Verify Pri Fashion deployment")
    parser.add_argument("username", help="PythonAnywhere username")
    args = parser.parse_args()
    
    backend_url = f"https://{args.username}.pythonanywhere.com"
    
    print("Pri Fashion Deployment Verification")
    print("==================================")
    
    backend_ok = check_backend(backend_url)
    
    if backend_ok:
        print("\n✅ Deployment verification successful!")
        print(f"\nBackend URL: {backend_url}")
        print(f"Admin URL: {backend_url}/admin/")
        print("\nNext steps:")
        print("1. Set up your frontend on Vercel or Netlify")
        print("2. Update CORS settings in backend/settings_prod.py with your frontend URL")
        print("3. Reload your PythonAnywhere web app")
        return 0
    else:
        print("\n❌ Deployment verification failed")
        print("\nTroubleshooting steps:")
        print("1. Check if your PythonAnywhere web app is running")
        print("2. Check the error logs in the PythonAnywhere dashboard")
        print("3. Verify your database configuration")
        print("4. Make sure you've run migrations")
        return 1

if __name__ == "__main__":
    sys.exit(main())
