#!/usr/bin/env python3
"""
Database Migration Script for Pri Fashion
Migrates data from local MySQL to Azure Database for MySQL
"""

import os
import sys
import subprocess
import pymysql
from datetime import datetime

def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return None

def backup_local_database():
    """Create a backup of the local database"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"prifashion_backup_{timestamp}.sql"
    
    print(f"\n📦 Creating backup of local database...")
    
    # MySQL dump command
    dump_command = f'mysqldump -u root -pboossa12 --single-transaction --routines --triggers prifashion > {backup_file}'
    
    if run_command(dump_command, "Database backup"):
        print(f"✅ Backup created: {backup_file}")
        return backup_file
    else:
        print("❌ Failed to create backup")
        return None

def test_azure_connection(host, user, password, database):
    """Test connection to Azure Database"""
    print(f"\n🔗 Testing Azure Database connection...")
    try:
        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=3306,
            ssl={'ssl-mode': 'REQUIRED'},
            charset='utf8mb4'
        )
        print("✅ Azure Database connection successful")
        connection.close()
        return True
    except Exception as e:
        print(f"❌ Azure Database connection failed: {e}")
        return False

def restore_to_azure(backup_file, host, user, password, database):
    """Restore backup to Azure Database"""
    print(f"\n📤 Restoring data to Azure Database...")
    
    # MySQL restore command for Azure
    restore_command = f'mysql -h {host} -u {user} -p{password} --ssl-mode=REQUIRED {database} < {backup_file}'
    
    if run_command(restore_command, "Data restoration to Azure"):
        print("✅ Data successfully restored to Azure Database")
        return True
    else:
        print("❌ Failed to restore data to Azure Database")
        return False

def run_django_migrations():
    """Run Django migrations on Azure database"""
    print(f"\n🔄 Running Django migrations on Azure database...")
    
    # Set environment to use Azure database
    os.environ['DATABASE_MODE'] = 'azure'
    
    # Run migrations
    migrate_command = 'python backend/manage.py migrate'
    
    if run_command(migrate_command, "Django migrations"):
        print("✅ Django migrations completed successfully")
        return True
    else:
        print("❌ Django migrations failed")
        return False

def main():
    print("🚀 Pri Fashion Database Migration to Azure")
    print("=" * 50)
    
    # Get Azure database credentials
    print("\n📝 Please provide your Azure Database credentials:")
    azure_host = input("Azure Database Host (e.g., prifashion-db-server.mysql.database.azure.com): ").strip()
    azure_user = input("Azure Database User (e.g., prifashionadmin): ").strip()
    azure_password = input("Azure Database Password: ").strip()
    azure_database = input("Azure Database Name (default: prifashion): ").strip() or "prifashion"
    
    if not all([azure_host, azure_user, azure_password]):
        print("❌ All Azure database credentials are required")
        return
    
    # Test Azure connection first
    if not test_azure_connection(azure_host, azure_user, azure_password, azure_database):
        print("❌ Cannot connect to Azure Database. Please check your credentials and try again.")
        return
    
    # Create backup of local database
    backup_file = backup_local_database()
    if not backup_file:
        print("❌ Cannot proceed without a backup")
        return
    
    # Confirm migration
    print(f"\n⚠️  WARNING: This will replace all data in the Azure database '{azure_database}'")
    confirm = input("Do you want to continue? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("❌ Migration cancelled")
        return
    
    # Restore to Azure
    if restore_to_azure(backup_file, azure_host, azure_user, azure_password, azure_database):
        print("\n🎉 Database migration completed successfully!")
        print(f"📁 Backup file saved as: {backup_file}")
        print("\n📋 Next steps:")
        print("1. Update your .env.azure file with the correct Azure database credentials")
        print("2. Copy .env.azure to .env to use Azure database")
        print("3. Test your application with the Azure database")
    else:
        print("❌ Migration failed")

if __name__ == "__main__":
    main()
