#!/usr/bin/env python3
"""
Pri Fashion Backup Status Dashboard
==================================
Provides a comprehensive view of backup system status
"""

import os
import json
import glob
from datetime import datetime, timedelta
import pymysql
from pathlib import Path

class BackupDashboard:
    def __init__(self):
        self.backup_dir = 'database_backups'
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': 'boossa12',
            'database': 'prifashion',
            'port': 3306
        }
    
    def get_backup_status(self):
        """Get status of all backup types"""
        status = {
            'daily': self.get_backup_type_status('daily', 1),
            'weekly': self.get_backup_type_status('weekly', 7),
            'monthly': self.get_backup_type_status('monthly', 30),
            'overall_health': 'UNKNOWN'
        }
        
        # Determine overall health
        if status['daily']['status'] == 'OK':
            status['overall_health'] = 'HEALTHY'
        elif status['daily']['last_backup_age_hours'] <= 48:
            status['overall_health'] = 'WARNING'
        else:
            status['overall_health'] = 'CRITICAL'
        
        return status
    
    def get_backup_type_status(self, backup_type, max_age_days):
        """Get status for specific backup type"""
        backup_path = os.path.join(self.backup_dir, backup_type)
        
        if not os.path.exists(backup_path):
            return {
                'status': 'NO_BACKUPS',
                'count': 0,
                'latest_backup': None,
                'last_backup_age_hours': None,
                'total_size_mb': 0
            }
        
        # Get all backup files
        backup_files = glob.glob(os.path.join(backup_path, '*.sql'))
        
        if not backup_files:
            return {
                'status': 'NO_BACKUPS',
                'count': 0,
                'latest_backup': None,
                'last_backup_age_hours': None,
                'total_size_mb': 0
            }
        
        # Sort by modification time
        backup_files.sort(key=os.path.getmtime, reverse=True)
        latest_backup = backup_files[0]
        
        # Calculate age
        latest_time = datetime.fromtimestamp(os.path.getmtime(latest_backup))
        age_hours = (datetime.now() - latest_time).total_seconds() / 3600
        
        # Calculate total size
        total_size = sum(os.path.getsize(f) for f in backup_files)
        total_size_mb = total_size / (1024 * 1024)
        
        # Determine status
        max_age_hours = max_age_days * 24
        if age_hours <= max_age_hours:
            status = 'OK'
        elif age_hours <= max_age_hours * 2:
            status = 'WARNING'
        else:
            status = 'CRITICAL'
        
        return {
            'status': status,
            'count': len(backup_files),
            'latest_backup': os.path.basename(latest_backup),
            'latest_backup_time': latest_time.strftime('%Y-%m-%d %H:%M:%S'),
            'last_backup_age_hours': round(age_hours, 1),
            'total_size_mb': round(total_size_mb, 2)
        }
    
    def get_database_status(self):
        """Get current database status"""
        try:
            connection = pymysql.connect(**self.db_config)
            cursor = connection.cursor()
            
            # Get database size
            cursor.execute("""
                SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.tables 
                WHERE table_schema = %s
            """, (self.db_config['database'],))
            
            db_size = cursor.fetchone()[0] or 0
            
            # Get table count
            cursor.execute("SHOW TABLES")
            table_count = len(cursor.fetchall())
            
            # Get record counts for key tables
            key_tables = [
                'authentication_customuser',
                'fabric_fabric',
                'cutting_cuttingorder',
                'sewing_sewingorder',
                'finished_product_finishedproduct',
                'packing_app_packingorder'
            ]
            
            table_stats = {}
            for table in key_tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    table_stats[table] = count
                except:
                    table_stats[table] = 'N/A'
            
            connection.close()
            
            return {
                'status': 'CONNECTED',
                'size_mb': db_size,
                'table_count': table_count,
                'key_table_stats': table_stats,
                'last_checked': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
        except Exception as e:
            return {
                'status': 'ERROR',
                'error': str(e),
                'last_checked': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
    
    def get_verification_status(self):
        """Get backup verification status"""
        report_file = 'backup_verification_report.json'
        
        if not os.path.exists(report_file):
            return {
                'status': 'NO_VERIFICATION',
                'last_verification': None
            }
        
        try:
            with open(report_file, 'r') as f:
                report = json.load(f)
            
            verification_time = datetime.fromisoformat(report['timestamp'])
            age_hours = (datetime.now() - verification_time).total_seconds() / 3600
            
            return {
                'status': report['status'],
                'last_verification': verification_time.strftime('%Y-%m-%d %H:%M:%S'),
                'age_hours': round(age_hours, 1),
                'results': report['verification_results']
            }
            
        except Exception as e:
            return {
                'status': 'ERROR',
                'error': str(e)
            }
    
    def get_disk_space_status(self):
        """Get disk space status for backup directory"""
        try:
            # Get disk usage for backup directory
            backup_path = Path(self.backup_dir)
            if backup_path.exists():
                total_backup_size = sum(f.stat().st_size for f in backup_path.rglob('*') if f.is_file())
                total_backup_size_mb = total_backup_size / (1024 * 1024)
            else:
                total_backup_size_mb = 0
            
            # Get available disk space
            import shutil
            total, used, free = shutil.disk_usage('.')
            
            free_gb = free / (1024 * 1024 * 1024)
            total_gb = total / (1024 * 1024 * 1024)
            used_percent = (used / total) * 100
            
            # Determine status
            if free_gb > 5:  # More than 5GB free
                status = 'OK'
            elif free_gb > 1:  # More than 1GB free
                status = 'WARNING'
            else:
                status = 'CRITICAL'
            
            return {
                'status': status,
                'total_backup_size_mb': round(total_backup_size_mb, 2),
                'free_space_gb': round(free_gb, 2),
                'total_space_gb': round(total_gb, 2),
                'used_percent': round(used_percent, 1)
            }
            
        except Exception as e:
            return {
                'status': 'ERROR',
                'error': str(e)
            }
    
    def generate_dashboard(self):
        """Generate complete dashboard"""
        print("🔍 Pri Fashion Backup System Dashboard")
        print("=" * 50)
        print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Overall Status
        backup_status = self.get_backup_status()
        health_icon = {
            'HEALTHY': '🟢',
            'WARNING': '🟡',
            'CRITICAL': '🔴',
            'UNKNOWN': '⚪'
        }
        
        print(f"🏥 OVERALL HEALTH: {health_icon[backup_status['overall_health']]} {backup_status['overall_health']}")
        print()
        
        # Backup Status
        print("📦 BACKUP STATUS")
        print("-" * 20)
        
        for backup_type, status in backup_status.items():
            if backup_type == 'overall_health':
                continue
                
            status_icon = {
                'OK': '✅',
                'WARNING': '⚠️',
                'CRITICAL': '❌',
                'NO_BACKUPS': '❌'
            }
            
            print(f"{backup_type.upper()}: {status_icon.get(status['status'], '❓')} {status['status']}")
            if status['latest_backup']:
                print(f"  Latest: {status['latest_backup']}")
                print(f"  Age: {status['last_backup_age_hours']} hours")
                print(f"  Count: {status['count']} files")
                print(f"  Size: {status['total_size_mb']} MB")
            print()
        
        # Database Status
        print("🗄️ DATABASE STATUS")
        print("-" * 20)
        db_status = self.get_database_status()
        
        if db_status['status'] == 'CONNECTED':
            print("✅ Database: CONNECTED")
            print(f"📊 Size: {db_status['size_mb']} MB")
            print(f"📋 Tables: {db_status['table_count']}")
            print("🔢 Key Table Records:")
            for table, count in db_status['key_table_stats'].items():
                table_name = table.replace('_', ' ').title()
                print(f"  {table_name}: {count}")
        else:
            print(f"❌ Database: {db_status['status']}")
            if 'error' in db_status:
                print(f"   Error: {db_status['error']}")
        print()
        
        # Verification Status
        print("🔍 VERIFICATION STATUS")
        print("-" * 25)
        verify_status = self.get_verification_status()
        
        if verify_status['status'] == 'PASSED':
            print("✅ Last Verification: PASSED")
            print(f"⏰ Time: {verify_status['last_verification']}")
            print(f"📅 Age: {verify_status['age_hours']} hours")
        elif verify_status['status'] == 'FAILED':
            print("❌ Last Verification: FAILED")
            print(f"⏰ Time: {verify_status['last_verification']}")
            print("🔧 Check verification logs for details")
        else:
            print("⚠️ No verification reports found")
        print()
        
        # Disk Space Status
        print("💾 DISK SPACE STATUS")
        print("-" * 22)
        disk_status = self.get_disk_space_status()
        
        if disk_status['status'] == 'OK':
            print("✅ Disk Space: OK")
        elif disk_status['status'] == 'WARNING':
            print("⚠️ Disk Space: WARNING")
        else:
            print("❌ Disk Space: CRITICAL")
        
        if 'error' not in disk_status:
            print(f"📁 Backup Size: {disk_status['total_backup_size_mb']} MB")
            print(f"💿 Free Space: {disk_status['free_space_gb']} GB")
            print(f"📊 Disk Usage: {disk_status['used_percent']}%")
        print()
        
        # Recommendations
        print("💡 RECOMMENDATIONS")
        print("-" * 20)
        
        recommendations = []
        
        if backup_status['overall_health'] == 'CRITICAL':
            recommendations.append("🚨 URGENT: Create backup immediately!")
        
        if backup_status['daily']['status'] != 'OK':
            recommendations.append("📅 Set up automated daily backups")
        
        if verify_status['status'] != 'PASSED':
            recommendations.append("🔍 Run backup verification test")
        
        if disk_status['status'] == 'CRITICAL':
            recommendations.append("💾 Free up disk space immediately")
        elif disk_status['status'] == 'WARNING':
            recommendations.append("💾 Monitor disk space usage")
        
        if not recommendations:
            recommendations.append("✅ All systems operating normally")
        
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec}")
        
        print()
        print("=" * 50)

def main():
    """Main function"""
    dashboard = BackupDashboard()
    dashboard.generate_dashboard()

if __name__ == "__main__":
    main()
