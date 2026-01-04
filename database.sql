CREATE DATABASE IF NOT EXISTS eduauth_registry
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

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
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Admins;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Admins (
  id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'System Administrator',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Users (
  id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('STUDENT', 'INSTITUTION', 'ADMIN') NOT NULL,
  status ENUM('PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
  emailVerified TINYINT(1) NOT NULL DEFAULT 0,
  emailVerifyToken VARCHAR(255) DEFAULT NULL,
  emailVerifyExpiry DATETIME DEFAULT NULL,
  resetToken VARCHAR(255) DEFAULT NULL,
  resetTokenExpiry DATETIME DEFAULT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_user_email (email),
  UNIQUE KEY uniq_user_emailVerifyToken (emailVerifyToken),
  UNIQUE KEY uniq_user_resetToken (resetToken)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Student (
  id CHAR(36) NOT NULL,
  userId CHAR(36) NOT NULL,
  firstName VARCHAR(255) NOT NULL,
  middleName VARCHAR(255) DEFAULT NULL,
  lastName VARCHAR(255) NOT NULL,
  dateOfBirth DATETIME NOT NULL,
  fatherName VARCHAR(255) NOT NULL,
  motherName VARCHAR(255) NOT NULL,
  identityType ENUM('NID', 'BIRTH_CERTIFICATE') NOT NULL,
  nidEncrypted TEXT DEFAULT NULL,
  birthCertEncrypted TEXT DEFAULT NULL,
  phone VARCHAR(50) NOT NULL,
  presentAddress VARCHAR(500) NOT NULL,
  nidOrBirthCertImage VARCHAR(255) NOT NULL,
  studentPhoto VARCHAR(255) NOT NULL,
  studentId VARCHAR(64) NOT NULL,
  rejectionReason TEXT DEFAULT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_student_userId (userId),
  UNIQUE KEY uniq_student_studentId (studentId),
  CONSTRAINT fk_student_user FOREIGN KEY (userId) REFERENCES Users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Institution (
  id CHAR(36) NOT NULL,
  userId CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('HIGH_SCHOOL', 'COLLEGE', 'TECHNICAL', 'MADRASAH', 'UNIVERSITY', 'TRAINING_CENTRE') NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(500) NOT NULL,
  eiin VARCHAR(64) DEFAULT NULL,
  registrationNumber VARCHAR(64) DEFAULT NULL,
  board ENUM('COMILLA', 'DHAKA', 'DINAJPUR', 'JESSORE', 'MYMENSINGH', 'RAJSHAHI', 'SYLHET', 'MADRASAH', 'TECHNICAL') DEFAULT NULL,
  authorityName VARCHAR(255) NOT NULL,
  authorityTitle VARCHAR(255) NOT NULL,
    authoritySignature VARCHAR(255) DEFAULT NULL,
  canIssueCertificates TINYINT(1) NOT NULL DEFAULT 1,
  rejectionReason TEXT DEFAULT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_institution_userId (userId),
  UNIQUE KEY uniq_institution_eiin (eiin),
  UNIQUE KEY uniq_institution_registrationNumber (registrationNumber),
  CONSTRAINT fk_institution_user FOREIGN KEY (userId) REFERENCES Users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Enrollment (
  id CHAR(36) NOT NULL,
  studentId CHAR(36) NOT NULL,
  institutionId CHAR(36) NOT NULL,
  studentInstitutionId VARCHAR(100) NOT NULL,
  enrollmentDate DATETIME NOT NULL,
  department VARCHAR(255) DEFAULT NULL,
  className VARCHAR(255) DEFAULT NULL,
  courseName VARCHAR(255) DEFAULT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_enrollment_student_institution (studentId, institutionId),
  CONSTRAINT fk_enrollment_student FOREIGN KEY (studentId) REFERENCES Student (id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_institution FOREIGN KEY (institutionId) REFERENCES Institution (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE EnrollmentRequest (
  id CHAR(36) NOT NULL,
  studentId CHAR(36) NOT NULL,
  institutionId CHAR(36) NOT NULL,
  studentInstitutionId VARCHAR(100) NOT NULL,
  enrollmentDate DATETIME NOT NULL,
  department VARCHAR(255) DEFAULT NULL,
  className VARCHAR(255) DEFAULT NULL,
  courseName VARCHAR(255) DEFAULT NULL,
  supportingDocs TEXT DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  institutionComments TEXT DEFAULT NULL,
  decidedAt DATETIME DEFAULT NULL,
  decidedBy CHAR(36) DEFAULT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_enrollment_request_student_institution_status (studentId, institutionId, status),
  CONSTRAINT fk_enrollment_request_student FOREIGN KEY (studentId) REFERENCES Student (id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_request_institution FOREIGN KEY (institutionId) REFERENCES Institution (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CertificateSequence (
  id INT NOT NULL AUTO_INCREMENT,
  lastSequence BIGINT NOT NULL DEFAULT 0,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Certificate (
  id CHAR(36) NOT NULL,
  serial VARCHAR(16) NOT NULL,
  sequenceNumber BIGINT NOT NULL,
  certificateType ENUM(
    'JSC', 'SSC', 'VOCATIONAL_SSC', 'HSC', 'VOCATIONAL_HSC', 'BM',
    'JDC', 'DAKHIL', 'ALIM', 'VOCATIONAL_MADRASAH',
    'DIPLOMA', 'BSC', 'MSC', 'BA', 'MA', 'BBA', 'MBA', 'LLB', 'LLM', 'MBBS', 'BDS',
    'TRAINING_COMPLETION', 'SKILL_CERTIFICATE'
  ) NOT NULL,
  studentId CHAR(36) NOT NULL,
  institutionId CHAR(36) NOT NULL,
  rollNumber VARCHAR(100) DEFAULT NULL,
  registrationNumber VARCHAR(100) DEFAULT NULL,
  examinationYear INT DEFAULT NULL,
  board ENUM('COMILLA', 'DHAKA', 'DINAJPUR', 'JESSORE', 'MYMENSINGH', 'RAJSHAHI', 'SYLHET', 'MADRASAH', 'TECHNICAL') DEFAULT NULL,
  groupName VARCHAR(100) DEFAULT NULL,
  gpa DECIMAL(3, 2) DEFAULT NULL,
  passingYear INT DEFAULT NULL,
  diplomaSubject VARCHAR(255) DEFAULT NULL,
  duration VARCHAR(100) DEFAULT NULL,
  sessionName VARCHAR(100) DEFAULT NULL,
  program VARCHAR(255) DEFAULT NULL,
  department VARCHAR(255) DEFAULT NULL,
  major VARCHAR(255) DEFAULT NULL,
  cgpa DECIMAL(3, 2) DEFAULT NULL,
  degreeClass VARCHAR(100) DEFAULT NULL,
  convocationDate DATETIME DEFAULT NULL,
  completionDate DATETIME DEFAULT NULL,
  skillName VARCHAR(255) DEFAULT NULL,
  issueDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  authorityName VARCHAR(255) NOT NULL,
  authorityTitle VARCHAR(255) NOT NULL,
    authoritySignature VARCHAR(255) DEFAULT NULL,
  isPubliclyShareable TINYINT(1) NOT NULL DEFAULT 1,
  qrCodeData TEXT NOT NULL,
  pdfPath VARCHAR(255) DEFAULT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_certificate_serial (serial),
  KEY idx_certificate_serial (serial),
  KEY idx_certificate_student (studentId),
  KEY idx_certificate_institution (institutionId),
  CONSTRAINT fk_certificate_student FOREIGN KEY (studentId) REFERENCES Student (id),
  CONSTRAINT fk_certificate_institution FOREIGN KEY (institutionId) REFERENCES Institution (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE InstitutionProgram (
  id CHAR(36) NOT NULL,
  institutionId CHAR(36) NOT NULL,
  programName VARCHAR(255) NOT NULL,
  programType VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  approvedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approvedBy CHAR(36) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_institution_program (institutionId, programName),
  CONSTRAINT fk_program_institution FOREIGN KEY (institutionId) REFERENCES Institution (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ProgramRequest (
  id CHAR(36) NOT NULL,
  institutionId CHAR(36) NOT NULL,
  programName VARCHAR(255) NOT NULL,
  programType VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  supportingDocs TEXT DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  adminComments TEXT DEFAULT NULL,
  decidedAt DATETIME DEFAULT NULL,
  decidedBy CHAR(36) DEFAULT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_program_request_institution FOREIGN KEY (institutionId) REFERENCES Institution (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ProfileChangeRequest (
  id CHAR(36) NOT NULL,
  studentId CHAR(36) NOT NULL,
  changes TEXT NOT NULL,
  supportingDocs TEXT DEFAULT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  adminComments TEXT DEFAULT NULL,
  decidedAt DATETIME DEFAULT NULL,
  decidedBy CHAR(36) DEFAULT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_profile_change_student FOREIGN KEY (studentId) REFERENCES Student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IssueReport (
  id CHAR(36) NOT NULL,
  ticketNumber VARCHAR(100) NOT NULL,
  studentId CHAR(36) DEFAULT NULL,
    reporterEmail VARCHAR(255) NOT NULL,
    reporterName VARCHAR(255) NOT NULL,
    issueType VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    attachments TEXT DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    targetType ENUM('ADMIN', 'INSTITUTION') NOT NULL DEFAULT 'ADMIN',
    institutionId CHAR(36) DEFAULT NULL,
    adminResponse TEXT DEFAULT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolvedAt DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_issue_ticket (ticketNumber),
    CONSTRAINT fk_issue_student FOREIGN KEY (studentId) REFERENCES Student (id),
    CONSTRAINT fk_issue_institution FOREIGN KEY (institutionId) REFERENCES Institution (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ActivityLog (
  id CHAR(36) NOT NULL,
  actorId CHAR(36) DEFAULT NULL,
  actorType VARCHAR(50) NOT NULL,
  actorName VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  targetType VARCHAR(100) DEFAULT NULL,
  targetId CHAR(36) DEFAULT NULL,
  details TEXT DEFAULT NULL,
  ipAddress VARCHAR(64) DEFAULT NULL,
  institutionId CHAR(36) DEFAULT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_actor (actorId),
  KEY idx_activity_created (createdAt),
  CONSTRAINT fk_activity_institution FOREIGN KEY (institutionId) REFERENCES Institution (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

