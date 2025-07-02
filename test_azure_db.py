#!/usr/bin/env python3
"""
Azure Database Connection Test for Pri Fashion
Tests connection to Azure Database for MySQL
"""

import pymysql
import os
from dotenv import load_dotenv

def test_azure_connection():
    """Test connection to Azure Database for MySQL"""
    
    # Load environment variables
    load_dotenv('.env.azure')
    
    # Get database credentials from environment
    host = os.getenv('DATABASE_HOST')
    user = os.getenv('DATABASE_USER')
    password = os.getenv('DATABASE_PASSWORD')
    database = os.getenv('DATABASE_NAME', 'prifashion')
    port = int(os.getenv('DATABASE_PORT', '3306'))
    
    print("🔗 Testing Azure Database for MySQL Connection")
    print("=" * 50)
    print(f"Host: {host}")
    print(f"User: {user}")
    print(f"Database: {database}")
    print(f"Port: {port}")
    print()
    
    if not all([host, user, password]):
        print("❌ Missing database credentials in .env.azure file")
        print("Please make sure the following variables are set:")
        print("- DATABASE_HOST")
        print("- DATABASE_USER") 
        print("- DATABASE_PASSWORD")
        return False
    
    try:
        print("🔄 Connecting to Azure Database...")
        
        # Connect to Azure Database for MySQL
        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port,
            ssl={'ssl-mode': 'REQUIRED'},
            charset='utf8mb4',
            connect_timeout=30
        )
        
        print("✅ Connection successful!")
        
        # Test basic operations
        cursor = connection.cursor()
        
        # Test database access
        print("\n🔄 Testing database operations...")
        
        # Show database version
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"✅ MySQL Version: {version[0]}")
        
        # Show current database
        cursor.execute("SELECT DATABASE()")
        current_db = cursor.fetchone()
        print(f"✅ Current Database: {current_db[0]}")
        
        # Show tables (if any)
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        if tables:
            print(f"✅ Found {len(tables)} tables:")
            for table in tables[:10]:  # Show first 10 tables
                print(f"   - {table[0]}")
            if len(tables) > 10:
                print(f"   ... and {len(tables) - 10} more tables")
        else:
            print("ℹ️  No tables found (database is empty)")
        
        # Test write permission
        try:
            cursor.execute("CREATE TABLE IF NOT EXISTS connection_test (id INT PRIMARY KEY, test_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
            cursor.execute("INSERT INTO connection_test (id) VALUES (1) ON DUPLICATE KEY UPDATE test_time = CURRENT_TIMESTAMP")
            cursor.execute("SELECT test_time FROM connection_test WHERE id = 1")
            test_result = cursor.fetchone()
            print(f"✅ Write test successful: {test_result[0]}")
            cursor.execute("DROP TABLE connection_test")
        except Exception as e:
            print(f"⚠️  Write test failed: {e}")
        
        # Close connection
        cursor.close()
        connection.close()
        
        print("\n🎉 Azure Database connection test completed successfully!")
        print("\n📋 Next steps:")
        print("1. Run the migration script: python migrate_to_azure.py")
        print("2. Switch to Azure database: switch_database.bat")
        print("3. Test your Django application")
        
        return True
        
    except pymysql.Error as e:
        print(f"❌ Database connection failed: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Check your Azure database credentials in .env.azure")
        print("2. Ensure your Azure database server is running")
        print("3. Check firewall settings (allow your IP address)")
        print("4. Verify SSL is enabled on your Azure database")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    """Main function"""
    if not os.path.exists('.env.azure'):
        print("❌ .env.azure file not found!")
        print("Please create .env.azure with your Azure database credentials.")
        print("\nExample .env.azure content:")
        print("DATABASE_MODE=azure")
        print("DATABASE_HOST=your-server.mysql.database.azure.com")
        print("DATABASE_USER=your-admin-username")
        print("DATABASE_PASSWORD=your-password")
        print("DATABASE_NAME=prifashion")
        print("DATABASE_PORT=3306")
        return
    
    test_azure_connection()

if __name__ == "__main__":
    main()
