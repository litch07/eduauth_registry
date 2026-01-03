# MySQL Schema Reference for EduAuth Registry

## 🗄️ Database Information

**Database Name:** `eduauth_registry`
**Collation:** `utf8mb4_unicode_ci` (supports international characters and emojis)
**Engine:** InnoDB (default, supports foreign keys and transactions)

---

## 📊 Complete Database Schema Summary

### Total Models: 13

1. **User** - Authentication base (Student/Institution/Admin)
2. **Student** - Student profiles with encrypted identity
3. **Institution** - Educational institution profiles
4. **Enrollment** - Approved student-institution relationships
5. **EnrollmentRequest** - Pending enrollment requests
6. **Certificate** - Issued certificates with serial numbers
7. **CertificateSequence** - Serial number generator
8. **InstitutionProgram** - Approved degree/training programs
9. **ProgramRequest** - Pending program approval requests
10. **ProfileChangeRequest** - Student profile update requests
11. **IssueReport** - Support tickets
12. **ActivityLog** - System audit trail
13. **Admin** - System administrator accounts

---

## 🔍 Useful MySQL Queries for Development

### Check Database and Tables
```sql
-- Show all databases
SHOW DATABASES;

-- Select our database
USE eduauth_registry;

-- Show all tables
SHOW TABLES;

-- Describe table structure
DESCRIBE User;
DESCRIBE Student;
DESCRIBE Certificate;

-- Count records in each table
SELECT 'Users' as Table_Name, COUNT(*) as Count FROM User
UNION ALL
SELECT 'Students', COUNT(*) FROM Student
UNION ALL
SELECT 'Institutions', COUNT(*) FROM Institution
UNION ALL
SELECT 'Certificates', COUNT(*) FROM Certificate;
```

### View Sample Data
```sql
-- View all users
SELECT id, email, role, status, emailVerified FROM User;

-- View all students with their user info
SELECT 
    s.id, s.firstName, s.lastName, s.studentId,
    u.email, u.status
FROM Student s
JOIN User u ON s.userId = u.id;

-- View all institutions
SELECT 
    i.name, i.type, i.board, i.canIssueCertificates,
    u.email, u.status
FROM Institution i
JOIN User u ON i.userId = u.id;

-- View all certificates with student and institution
SELECT 
    c.serial, c.certificateType, c.issueDate,
    CONCAT(s.firstName, ' ', s.lastName) as student_name,
    i.name as institution_name
FROM Certificate c
JOIN Student s ON c.studentId = s.id
JOIN Institution i ON c.institutionId = i.id
ORDER BY c.issueDate DESC
LIMIT 10;
```

### Check Enrollments
```sql
-- View all enrollments
SELECT 
    CONCAT(s.firstName, ' ', s.lastName) as student_name,
    i.name as institution_name,
    e.studentInstitutionId,
    e.department, e.class, e.courseName,
    e.enrollmentDate
FROM Enrollment e
JOIN Student s ON e.studentId = s.id
JOIN Institution i ON e.institutionId = i.id;

-- View pending enrollment requests
SELECT 
    CONCAT(s.firstName, ' ', s.lastName) as student_name,
    s.user.email as student_email,
    i.name as institution_name,
    er.studentInstitutionId,
    er.status,
    er.createdAt
FROM EnrollmentRequest er
JOIN Student s ON er.studentId = s.id
JOIN Institution i ON er.institutionId = i.id
WHERE er.status = 'PENDING';
```

### Find Records by Email
```sql
-- Find user by email
SELECT * FROM User WHERE email = 'student@example.com';

-- Find student by user email
SELECT s.*, u.email 
FROM Student s 
JOIN User u ON s.userId = u.id 
WHERE u.email = 'student@example.com';

-- Find institution by email
SELECT i.*, u.email 
FROM Institution i 
JOIN User u ON i.userId = u.id 
WHERE u.email = 'university@example.com';
```

### Certificate Verification Queries
```sql
-- Verify certificate by serial
SELECT 
    c.serial,
    c.certificateType,
    c.issueDate,
    CONCAT(s.firstName, ' ', s.lastName) as student_name,
    s.dateOfBirth,
    i.name as institution_name,
    i.type as institution_type,
    c.gpa, c.cgpa,
    c.isPubliclyShareable
FROM Certificate c
JOIN Student s ON c.studentId = s.id
JOIN Institution i ON c.institutionId = i.id
WHERE c.serial = 'A7K9M3X';

-- Find all certificates for a student
SELECT 
    c.serial,
    c.certificateType,
    i.name as institution,
    c.issueDate,
    c.gpa, c.cgpa
FROM Certificate c
JOIN Institution i ON c.institutionId = i.id
WHERE c.studentId = 'student-uuid-here'
ORDER BY c.issueDate DESC;
```

### Admin Queries
```sql
-- Count pending approvals
SELECT 
    (SELECT COUNT(*) FROM User WHERE status = 'PENDING_APPROVAL' AND role = 'STUDENT') as pending_students,
    (SELECT COUNT(*) FROM User WHERE status = 'PENDING_APPROVAL' AND role = 'INSTITUTION') as pending_institutions,
    (SELECT COUNT(*) FROM ProfileChangeRequest WHERE status = 'PENDING') as pending_profile_changes,
    (SELECT COUNT(*) FROM ProgramRequest WHERE status = 'PENDING') as pending_programs;

-- Recent activity log
SELECT 
    actorName,
    actorType,
    action,
    targetType,
    createdAt
FROM ActivityLog
ORDER BY createdAt DESC
LIMIT 20;

-- View all issue reports
SELECT 
    ticketNumber,
    reporterName,
    reporterEmail,
    issueType,
    status,
    createdAt
FROM IssueReport
ORDER BY createdAt DESC;
```

---

## 🛠️ Database Maintenance Commands

### Backup Database
```sql
-- From command line (not in MySQL prompt)
# Windows (in XAMPP directory)
cd C:\xampp\mysql\bin
mysqldump -u root eduauth_registry > backup.sql

# macOS/Linux
mysqldump -u root -p eduauth_registry > backup.sql
```

### Restore Database
```sql
# Windows
cd C:\xampp\mysql\bin
mysql -u root eduauth_registry < backup.sql

# macOS/Linux
mysql -u root -p eduauth_registry < backup.sql
```

### Reset Database (Clear All Data)
```sql
-- ⚠️ WARNING: This deletes ALL data!

USE eduauth_registry;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS ActivityLog;
DROP TABLE IF EXISTS IssueReport;
DROP TABLE IF EXISTS Certificate;
DROP TABLE IF EXISTS CertificateSequence;
DROP TABLE IF EXISTS Enrollment;
DROP TABLE IF EXISTS EnrollmentRequest;
DROP TABLE IF EXISTS InstitutionProgram;
DROP TABLE IF EXISTS ProgramRequest;
DROP TABLE IF EXISTS ProfileChangeRequest;
DROP TABLE IF EXISTS Institution;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Admin;
DROP TABLE IF EXISTS _prisma_migrations;

SET FOREIGN_KEY_CHECKS = 1;

-- Then run: npx prisma migrate dev
```

### Check Database Size
```sql
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'eduauth_registry'
ORDER BY (data_length + index_length) DESC;
```

---

## 🔐 Security Queries

### Check for Unverified Emails
```sql
SELECT email, role, createdAt 
FROM User 
WHERE emailVerified = 0
ORDER BY createdAt DESC;
```

### Check for Rejected Registrations
```sql
-- Students
SELECT 
    CONCAT(s.firstName, ' ', s.lastName) as name,
    u.email,
    s.rejectionReason,
    u.createdAt
FROM Student s
JOIN User u ON s.userId = u.id
WHERE u.status = 'REJECTED';

-- Institutions
SELECT 
    i.name,
    u.email,
    i.rejectionReason,
    u.createdAt
FROM Institution i
JOIN User u ON i.userId = u.id
WHERE u.status = 'REJECTED';
```

### Find Institutions Without Certificate Permission
```sql
SELECT 
    i.name,
    i.type,
    u.email,
    i.canIssueCertificates
FROM Institution i
JOIN User u ON i.userId = u.id
WHERE i.canIssueCertificates = 0;
```

---

## 📈 Statistics Queries

### System Overview
```sql
SELECT 
    (SELECT COUNT(*) FROM User WHERE role = 'STUDENT' AND status = 'APPROVED') as total_students,
    (SELECT COUNT(*) FROM User WHERE role = 'INSTITUTION' AND status = 'APPROVED') as total_institutions,
    (SELECT COUNT(*) FROM Certificate) as total_certificates,
    (SELECT COUNT(*) FROM Enrollment) as total_enrollments;
```

### Certificates by Type
```sql
SELECT 
    certificateType,
    COUNT(*) as count
FROM Certificate
GROUP BY certificateType
ORDER BY count DESC;
```

### Certificates by Institution
```sql
SELECT 
    i.name,
    i.type,
    COUNT(c.id) as certificates_issued
FROM Institution i
LEFT JOIN Certificate c ON i.id = c.institutionId
JOIN User u ON i.userId = u.id
WHERE u.status = 'APPROVED'
GROUP BY i.id, i.name, i.type
ORDER BY certificates_issued DESC;
```

### Monthly Registration Trend
```sql
SELECT 
    DATE_FORMAT(createdAt, '%Y-%m') as month,
    role,
    COUNT(*) as registrations
FROM User
WHERE status = 'APPROVED'
GROUP BY DATE_FORMAT(createdAt, '%Y-%m'), role
ORDER BY month DESC;
```

---

## 🧪 Testing Data Queries

### Insert Test Admin (Already in Seed)
```sql
INSERT INTO Admin (id, email, password, name, createdAt, updatedAt)
VALUES (
    UUID(),
    'eduauthregistry@gmail.com',
    '$2a$12$hash_here',  -- bcrypt hash of 'admin'
    'System Administrator',
    NOW(),
    NOW()
);
```

### Insert Test Student User
```sql
-- First create User
INSERT INTO User (id, email, password, role, status, emailVerified, createdAt, updatedAt)
VALUES (
    'user-uuid-here',
    'student@test.com',
    '$2a$12$hash_here',
    'STUDENT',
    'APPROVED',
    1,
    NOW(),
    NOW()
);

-- Then create Student profile
INSERT INTO Student (
    id, userId, firstName, lastName, dateOfBirth,
    identityType, nidEncrypted,
    fatherName, motherName, phone, presentAddress,
    nidOrBirthCertImage, studentPhoto, studentId,
    createdAt, updatedAt
)
VALUES (
    'student-uuid-here',
    'user-uuid-here',
    'Test', 'Student', '2000-01-01',
    'NID', 'encrypted_nid_here',
    'Father Name', 'Mother Name', '01712345678', 'Dhaka, Bangladesh',
    '/uploads/students/nid.jpg', '/uploads/students/photo.jpg', 'STD-001',
    NOW(), NOW()
);
```

---

## 🚨 Troubleshooting Queries

### Find Orphaned Records
```sql
-- Students without User
SELECT s.id, s.firstName, s.lastName
FROM Student s
LEFT JOIN User u ON s.userId = u.id
WHERE u.id IS NULL;

-- Certificates without Student
SELECT c.id, c.serial
FROM Certificate c
LEFT JOIN Student s ON c.studentId = s.id
WHERE s.id IS NULL;
```

### Find Duplicate Emails
```sql
SELECT email, COUNT(*) as count
FROM User
GROUP BY email
HAVING COUNT(*) > 1;
```

### Check Enrollment Conflicts
```sql
-- Students enrolled in same institution multiple times
SELECT 
    studentId,
    institutionId,
    COUNT(*) as enrollment_count
FROM Enrollment
GROUP BY studentId, institutionId
HAVING COUNT(*) > 1;
```

### Check Certificate Serial Conflicts
```sql
-- Duplicate serials (should never happen!)
SELECT serial, COUNT(*) as count
FROM Certificate
GROUP BY serial
HAVING COUNT(*) > 1;
```

---

## 💡 Performance Optimization

### Add Indexes (Prisma does this automatically, but for reference)
```sql
-- Email index (for fast user lookup)
CREATE INDEX idx_user_email ON User(email);

-- Serial index (for certificate verification)
CREATE INDEX idx_certificate_serial ON Certificate(serial);

-- Student ID index
CREATE INDEX idx_student_studentid ON Student(studentId);

-- Status indexes for filtering
CREATE INDEX idx_user_status ON User(status);
CREATE INDEX idx_user_role ON User(role);
```

### Check Query Performance
```sql
-- Enable profiling
SET profiling = 1;

-- Run your query
SELECT * FROM Certificate WHERE serial = 'A7K9M3X';

-- Show profile
SHOW PROFILES;

-- Show detailed profile
SHOW PROFILE FOR QUERY 1;
```

---

## 📝 Notes for Developers

1. **Always use Prisma** for database operations in code - don't write raw SQL
2. **Use phpMyAdmin** for quick checks and manual fixes only
3. **Backup before migrations** - especially when making schema changes
4. **Check foreign keys** - MySQL enforces them, so deletions must respect relationships
5. **Use transactions** for multi-step operations (Prisma handles this)
6. **Monitor database size** - especially the uploads and logs
7. **Index frequently queried fields** - Prisma creates them based on @unique and @index

---

## 🔗 Quick Access URLs

- **phpMyAdmin:** http://localhost/phpmyadmin
- **Prisma Studio:** http://localhost:5555 (run: `npx prisma studio`)
- **API Documentation:** http://localhost:5000/api (if you set up API docs)

---

**Last Updated:** January 2, 2026
**Database Version:** MySQL 8.0+ (via XAMPP)
