# Pri Fashion Disaster Recovery Guide

## 🚨 Emergency Data Recovery Procedures

### Quick Recovery Checklist
- [ ] Assess the damage/data loss
- [ ] Stop all applications accessing the database
- [ ] Identify the most recent valid backup
- [ ] Test backup integrity before restore
- [ ] Perform restore procedure
- [ ] Verify data integrity
- [ ] Resume operations

## 📋 Data Protection Strategy

### 1. Backup Types and Schedule

#### Daily Backups
- **Location**: `database_backups/daily/`
- **Retention**: 7 days
- **Schedule**: Every day at 2:00 AM
- **Type**: Full database dump with all data, triggers, routines

#### Weekly Backups
- **Location**: `database_backups/weekly/`
- **Retention**: 4 weeks
- **Schedule**: Every Sunday
- **Type**: Complete database backup

#### Monthly Backups
- **Location**: `database_backups/monthly/`
- **Retention**: 12 months
- **Schedule**: 1st day of each month
- **Type**: Archive-quality backup

#### Remote Backups
- **Location**: Network drive or cloud storage
- **Retention**: 30 days
- **Purpose**: Protection against local hardware failure

### 2. Backup Verification

Run backup verification daily:
```bash
python verify_backup_integrity.py
```

This will:
- Check backup file integrity
- Test restore procedure on test database
- Verify data completeness
- Generate verification report

## 🔧 Recovery Procedures

### Scenario 1: Complete Database Loss

1. **Stop all applications**
   ```bash
   # Stop Django server
   taskkill /f /im python.exe
   
   # Stop Electron app
   taskkill /f /im "Pri Fashion.exe"
   ```

2. **Recreate database**
   ```sql
   mysql -u root -pboossa12
   DROP DATABASE IF EXISTS prifashion;
   CREATE DATABASE prifashion;
   exit
   ```

3. **Restore from latest backup**
   ```bash
   # Find latest backup
   dir database_backups\daily\*.sql /o-d
   
   # Restore (replace with actual filename)
   mysql -u root -pboossa12 < database_backups\daily\prifashion_daily_YYYY-MM-DD_HH-MM-SS.sql
   ```

4. **Verify restoration**
   ```bash
   python test_db.py
   python verify_backup_integrity.py
   ```

### Scenario 2: Partial Data Corruption

1. **Identify affected tables**
   ```sql
   mysql -u root -pboossa12 prifashion
   CHECK TABLE table_name;
   ```

2. **Extract specific tables from backup**
   ```bash
   # Extract specific table
   sed -n '/CREATE TABLE `table_name`/,/UNLOCK TABLES;/p' backup_file.sql > table_restore.sql
   mysql -u root -pboossa12 prifashion < table_restore.sql
   ```

### Scenario 3: Accidental Data Deletion

1. **Stop all write operations immediately**
2. **Create current state backup**
   ```bash
   mysqldump -u root -pboossa12 prifashion > emergency_backup_before_restore.sql
   ```
3. **Restore from backup before deletion occurred**
4. **Manually merge any valid data created after backup**

## 🛡️ Prevention Measures

### 1. Automated Backup System

Set up Windows Task Scheduler to run daily backups:

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Pri Fashion Daily Backup"
4. Trigger: Daily at 2:00 AM
5. Action: Start Program
6. Program: `automated_backup_system.bat`
7. Start in: Your project directory

### 2. Database Monitoring

Monitor database health:
```bash
# Check database size growth
mysql -u root -pboossa12 -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema='prifashion';"

# Check for corrupted tables
mysql -u root -pboossa12 prifashion -e "CHECK TABLE table_name;"
```

### 3. User Access Control

Implement proper user permissions:
```sql
-- Create backup user with limited permissions
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'secure_backup_password';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON prifashion.* TO 'backup_user'@'localhost';

-- Create application user with necessary permissions
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'secure_app_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON prifashion.* TO 'app_user'@'localhost';
```

## 📊 Backup Storage Recommendations

### Local Storage
- **Primary**: SSD for fast backup/restore
- **Secondary**: External HDD for additional copies
- **Minimum Space**: 10GB (allows for growth)

### Remote Storage Options
1. **Network Drive**: `\\server\prifashion_backups`
2. **Cloud Storage**: Google Drive, OneDrive, Dropbox
3. **External Drive**: Rotated weekly

### 3-2-1 Backup Rule
- **3** copies of important data
- **2** different storage media
- **1** offsite backup

## 🔍 Regular Maintenance

### Weekly Tasks
- [ ] Verify automated backups are running
- [ ] Check backup file sizes for anomalies
- [ ] Test one backup restore procedure
- [ ] Review backup logs for errors

### Monthly Tasks
- [ ] Full backup verification test
- [ ] Update disaster recovery documentation
- [ ] Review and update backup retention policies
- [ ] Test remote backup accessibility

### Quarterly Tasks
- [ ] Complete disaster recovery drill
- [ ] Review and update recovery procedures
- [ ] Audit user access permissions
- [ ] Update backup storage capacity

## 📞 Emergency Contacts

### Technical Support
- Database Administrator: [Your Contact]
- System Administrator: [Your Contact]
- Application Developer: [Your Contact]

### Business Contacts
- IT Manager: [Your Contact]
- Business Owner: [Your Contact]

## 📝 Recovery Log Template

```
Date: ___________
Time Started: ___________
Issue Description: ___________
Recovery Method Used: ___________
Backup File Used: ___________
Time Completed: ___________
Data Loss Assessment: ___________
Lessons Learned: ___________
```

## ⚠️ Important Notes

1. **Never restore over a working database without backing it up first**
2. **Always verify backup integrity before relying on it**
3. **Test recovery procedures regularly in a safe environment**
4. **Keep multiple generations of backups**
5. **Document any changes to the recovery procedures**
6. **Train multiple people on recovery procedures**

## 🔧 Troubleshooting Common Issues

### Backup File Corrupted
- Check disk space during backup creation
- Verify MySQL service was running during backup
- Use `mysqlcheck` to verify database integrity before backup

### Restore Fails
- Check MySQL error logs
- Verify user permissions
- Ensure target database exists
- Check for disk space issues

### Performance Issues During Backup
- Schedule backups during low-usage periods
- Use `--single-transaction` for InnoDB tables
- Consider incremental backups for large databases

Remember: **The best backup is the one you've tested and verified works!**
