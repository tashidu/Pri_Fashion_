#!/usr/bin/env python3
"""
Pri Fashion Backup Verification System
=====================================
Verifies backup integrity and tests restore procedures
"""

import os
import sys
import subprocess
import tempfile
import pymysql
from datetime import datetime, timedelta
import glob
import json

class BackupVerifier:
    def __init__(self):
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': 'boossa12',
            'port': 3306
        }
        self.main_db = 'prifashion'
        self.test_db = 'prifashion_test_restore'
        self.backup_dir = 'database_backups'
        
    def log_message(self, message, level="INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
        # Also log to file
        with open('backup_verification.log', 'a', encoding='utf-8') as f:
            f.write(f"[{timestamp}] {level}: {message}\n")
    
    def get_latest_backup(self):
        """Get the most recent backup file"""
        daily_backups = glob.glob(os.path.join(self.backup_dir, 'daily', '*.sql'))
        if not daily_backups:
            return None
        
        # Sort by modification time, get latest
        latest_backup = max(daily_backups, key=os.path.getmtime)
        return latest_backup
    
    def verify_backup_file(self, backup_file):
        """Verify backup file integrity"""
        self.log_message(f"Verifying backup file: {backup_file}")
        
        if not os.path.exists(backup_file):
            self.log_message(f"Backup file not found: {backup_file}", "ERROR")
            return False
        
        # Check file size
        file_size = os.path.getsize(backup_file)
        if file_size < 1000:  # Less than 1KB is suspicious
            self.log_message(f"Backup file too small: {file_size} bytes", "ERROR")
            return False
        
        # Check if file contains SQL content
        try:
            with open(backup_file, 'r', encoding='utf-8') as f:
                first_lines = f.read(1000)
                if 'CREATE DATABASE' not in first_lines and 'USE ' not in first_lines:
                    self.log_message("Backup file doesn't contain expected SQL content", "ERROR")
                    return False
        except Exception as e:
            self.log_message(f"Error reading backup file: {e}", "ERROR")
            return False
        
        self.log_message(f"Backup file verification passed - Size: {file_size} bytes")
        return True
    
    def create_test_database(self):
        """Create a test database for restore verification"""
        try:
            connection = pymysql.connect(**self.db_config)
            cursor = connection.cursor()
            
            # Drop test database if exists
            cursor.execute(f"DROP DATABASE IF EXISTS {self.test_db}")
            
            # Create test database
            cursor.execute(f"CREATE DATABASE {self.test_db}")
            
            connection.close()
            self.log_message(f"Test database '{self.test_db}' created successfully")
            return True
            
        except Exception as e:
            self.log_message(f"Error creating test database: {e}", "ERROR")
            return False
    
    def test_restore(self, backup_file):
        """Test restore procedure on test database"""
        self.log_message(f"Testing restore from: {backup_file}")
        
        try:
            # Modify backup file to use test database
            with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as temp_file:
                with open(backup_file, 'r', encoding='utf-8') as original:
                    content = original.read()
                    # Replace database name in the backup
                    content = content.replace(f'CREATE DATABASE /*!32312 IF NOT EXISTS*/ `{self.main_db}`',
                                            f'CREATE DATABASE /*!32312 IF NOT EXISTS*/ `{self.test_db}`')
                    content = content.replace(f'USE `{self.main_db}`;', f'USE `{self.test_db}`;')
                    temp_file.write(content)
                    temp_backup = temp_file.name
            
            # Execute restore
            cmd = f'mysql -u {self.db_config["user"]} -p{self.db_config["password"]} < "{temp_backup}"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            # Clean up temp file
            os.unlink(temp_backup)
            
            if result.returncode != 0:
                self.log_message(f"Restore test failed: {result.stderr}", "ERROR")
                return False
            
            # Verify restored data
            if self.verify_restored_data():
                self.log_message("Restore test completed successfully")
                return True
            else:
                return False
                
        except Exception as e:
            self.log_message(f"Error during restore test: {e}", "ERROR")
            return False
    
    def verify_restored_data(self):
        """Verify that restored data is complete"""
        try:
            connection = pymysql.connect(database=self.test_db, **self.db_config)
            cursor = connection.cursor()
            
            # Check if main tables exist
            expected_tables = [
                'auth_user', 'authentication_customuser', 'authentication_role',
                'fabric_fabric', 'cutting_cuttingorder', 'sewing_sewingorder',
                'finished_product_finishedproduct', 'packing_app_packingorder'
            ]
            
            cursor.execute("SHOW TABLES")
            existing_tables = [table[0] for table in cursor.fetchall()]
            
            missing_tables = []
            for table in expected_tables:
                if table not in existing_tables:
                    missing_tables.append(table)
            
            if missing_tables:
                self.log_message(f"Missing tables in restored database: {missing_tables}", "ERROR")
                connection.close()
                return False
            
            # Check if tables have data (at least some basic records)
            cursor.execute("SELECT COUNT(*) FROM authentication_role")
            role_count = cursor.fetchone()[0]
            
            if role_count == 0:
                self.log_message("No roles found in restored database", "ERROR")
                connection.close()
                return False
            
            connection.close()
            self.log_message(f"Data verification passed - Found {len(existing_tables)} tables, {role_count} roles")
            return True
            
        except Exception as e:
            self.log_message(f"Error verifying restored data: {e}", "ERROR")
            return False
    
    def cleanup_test_database(self):
        """Clean up test database"""
        try:
            connection = pymysql.connect(**self.db_config)
            cursor = connection.cursor()
            cursor.execute(f"DROP DATABASE IF EXISTS {self.test_db}")
            connection.close()
            self.log_message("Test database cleaned up")
        except Exception as e:
            self.log_message(f"Error cleaning up test database: {e}", "WARNING")
    
    def generate_report(self, results):
        """Generate verification report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'verification_results': results,
            'status': 'PASSED' if all(results.values()) else 'FAILED'
        }
        
        # Save JSON report
        with open('backup_verification_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        # Print summary
        print("\n" + "="*50)
        print("BACKUP VERIFICATION REPORT")
        print("="*50)
        print(f"Timestamp: {report['timestamp']}")
        print(f"Overall Status: {report['status']}")
        print("\nDetailed Results:")
        for test, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"  {test}: {status}")
        print("="*50)
    
    def run_verification(self):
        """Run complete backup verification"""
        self.log_message("Starting backup verification process")
        
        results = {
            'backup_file_exists': False,
            'backup_file_valid': False,
            'test_database_created': False,
            'restore_test_passed': False,
            'data_verification_passed': False
        }
        
        try:
            # Get latest backup
            latest_backup = self.get_latest_backup()
            if not latest_backup:
                self.log_message("No backup files found", "ERROR")
                return results
            
            results['backup_file_exists'] = True
            
            # Verify backup file
            if not self.verify_backup_file(latest_backup):
                return results
            results['backup_file_valid'] = True
            
            # Create test database
            if not self.create_test_database():
                return results
            results['test_database_created'] = True
            
            # Test restore
            if not self.test_restore(latest_backup):
                return results
            results['restore_test_passed'] = True
            results['data_verification_passed'] = True
            
            self.log_message("All verification tests passed!")
            
        except Exception as e:
            self.log_message(f"Verification process failed: {e}", "ERROR")
        
        finally:
            # Always cleanup
            self.cleanup_test_database()
            self.generate_report(results)
        
        return results

def main():
    """Main function"""
    print("Pri Fashion Backup Verification System")
    print("="*40)
    
    verifier = BackupVerifier()
    results = verifier.run_verification()
    
    # Exit with appropriate code
    sys.exit(0 if all(results.values()) else 1)

if __name__ == "__main__":
    main()
