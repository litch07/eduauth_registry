# EduAuth Registry - Complete System Specification

## 🎯 Project Overview

**EduAuth Registry** is a Centralized Digital Trust Platform for academic credentials in Bangladesh. It replaces slow, paper-based verification with instant, tamper-proof digital certificates using cryptographic hashing (SHA-256).

### Core Value Proposition
- **For Universities:** Protect institutional reputation from degree fraud
- **For Students:** Prove achievements instantly anywhere
- **For Employers:** Verify credentials in seconds, not weeks

---

## 🏗️ System Architecture

### Technology Stack
**Backend:**
- Node.js with Express.js
- PostgreSQL database
- Prisma ORM (best for type-safety and database management)
- JWT authentication (jsonwebtoken)
- Bcrypt for password hashing (bcryptjs)
- Nodemailer for emails

**Frontend:**
- React.js 18+ with React Router v6
- **shadcn/ui** (recommended - professional, customizable, accessible components)
- Tailwind CSS v3+ for styling
- Axios for API calls
- React Query (TanStack Query) for server state management
- React Hook Form for form handling
- Zod for validation

**Additional Libraries:**
- **qrcode** - QR code generation
- **pdfkit** - Professional PDF generation (best for custom layouts)
- **multer** - File upload handling
- **express-rate-limit** - Rate limiting middleware
- **helmet** - Security headers
- **cors** - CORS handling
- **date-fns** - Date manipulation
- **uuid** - Unique ID generation
- **crypto** (Node.js built-in) - Encryption/hashing
- **lucide-react** - Beautiful icons for UI

**Development Tools:**
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **nodemon** - Development server
- **concurrently** - Run backend & frontend together

---

## 🎨 UI/UX Requirements

### Design Principles
- **Modern and Professional:** Think Stripe, Vercel, or Linear design quality
- **Clean Minimalism:** Generous whitespace, clear typography, intuitive navigation
- **Responsive First:** Perfect on mobile (320px), tablet (768px), desktop (1024px+)
- **Accessible:** WCAG AA compliance, keyboard navigation, screen reader friendly
- **Performant:** Fast page loads, skeleton loaders, optimistic UI updates

### Color Scheme (Professional Academic Palette)

**Primary Colors:**
- **Primary:** `#1E40AF` (Deep Blue) - Trust, authority, academic excellence
- **Primary Hover:** `#1E3A8A` (Darker Blue)
- **Primary Light:** `#3B82F6` (Bright Blue) - For accents and highlights

**Secondary Colors:**
- **Secondary:** `#059669` (Emerald Green) - Growth, verification, success
- **Secondary Hover:** `#047857` (Darker Emerald)

**Neutral Colors:**
- **Background:** `#F9FAFB` (Very Light Gray) - Clean, professional
- **Surface:** `#FFFFFF` (White) - Cards, modals, elevated elements
- **Border:** `#E5E7EB` (Light Gray)
- **Text Primary:** `#111827` (Almost Black)
- **Text Secondary:** `#6B7280` (Medium Gray)
- **Text Tertiary:** `#9CA3AF` (Light Gray)

**Semantic Colors:**
- **Success:** `#10B981` (Green) - Approvals, verified certificates
- **Warning:** `#F59E0B` (Amber) - Pending actions, cautions
- **Error:** `#EF4444` (Red) - Rejections, errors, critical actions
- **Info:** `#3B82F6` (Blue) - Information, help text

**Special Purpose:**
- **Certificate Gold:** `#D97706` (Amber 600) - For certificate badges/seals
- **Verified Badge:** `#059669` (Emerald 600) - Verification checkmarks
- **Shadow:** `rgba(0, 0, 0, 0.1)` - Subtle depth

**Gradients:**
- **Hero Gradient:** `linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)`
- **Card Hover:** `linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)`

This palette provides:
- Professional academic credibility
- Excellent contrast for accessibility (WCAG AA compliant)
- Clear visual hierarchy
- Trust and authority (blue)
- Verification and success (green)
- Works well in print (certificates)
- Gender-neutral and culturally appropriate

### Typography
- Headings: Inter, SF Pro Display, or Poppins (Bold, 600-700 weight)
- Body: Inter, SF Pro Text, or Open Sans (Regular, 400-500 weight)
- Monospace (for serials/codes): JetBrains Mono or Fira Code

### Component Standards
- **Buttons:** Rounded corners (6-8px), clear hover states, loading spinners
- **Forms:** Floating labels or top labels, inline validation, clear error messages
- **Cards:** Subtle shadows, hover effects, organized content
- **Tables:** Zebra striping, sortable headers, pagination, search
- **Modals:** Backdrop blur, smooth animations, accessible close buttons
- **Toasts:** Top-right position, auto-dismiss, icon indicators

---

## 🔐 Security Requirements

### Critical Security Measures

1. **Password Security:**
   - Bcrypt hashing with 12 rounds
   - Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
   - Password strength indicator on forms
   - Secure password reset with 1-hour token expiry

2. **Identity Protection (SIMPLIFIED APPROACH):**
   - **AES-256 encryption** for NID/Birth Certificate (for secure storage and display)
   - Store identity type (NID or Birth Certificate)
   - Never store or expose plain identity numbers in logs or API responses
   - **Search by email** (unique, safe, reliable) instead of identity number hashing
   - Identity numbers only shown to:
     - Student (decrypted in their profile)
     - Admin (decrypted for verification during approval)
   - Institutions CANNOT see student identity numbers (privacy protection)
   - Create helper functions: `encryptIdentity()`, `decryptIdentity()`

3. **Email Verification:**
   - Secure random tokens (32+ characters)
   - 24-hour expiry for registration verification
   - 1-hour expiry for password reset
   - Resend verification option

4. **JWT Authentication:**
   - Secret from environment (32+ characters)
   - 7-day expiration
   - Role-based middleware: `requireStudent`, `requireInstitution`, `requireAdmin`
   - Refresh token mechanism (optional but good)

5. **File Upload Security:**
   - Validate MIME types (check magic bytes, not just extension)
   - Size limits: Images 2MB, Documents 5MB
   - Rename files with UUID + original extension
   - Store in organized folders: `/uploads/students/`, `/uploads/institutions/`
   - Prevent path traversal attacks

6. **Rate Limiting:**
   - Login: 5 attempts per 15 minutes per IP
   - Registration: 3 per hour per IP
   - Verification: 20 per minute per IP
   - API endpoints: 100 per 15 minutes per user

7. **Input Validation:**
   - Validate all inputs server-side (never trust client)
   - Sanitize to prevent XSS
   - Use Prisma's parameterized queries (prevents SQL injection)

8. **Environment Variables (.env):**

**Backend (.env in backend folder):**
```env
# Database (MySQL running in XAMPP)
DATABASE_URL="mysql://root:@localhost:3306/eduauth_registry"
# Or with password: DATABASE_URL="mysql://root:your_password@localhost:3306/eduauth_registry"

# JWT Secret (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-generated-randomly"

# Encryption Keys (generate both with above command)
ENCRYPTION_KEY="64-character-hex-string-for-aes-256-encryption-key"
ENCRYPTION_IV="32-character-hex-string-for-aes-256-initialization-vector"

# Email Configuration (Gmail for testing)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"  # Generate from Google Account settings
EMAIL_FROM="EduAuth Registry <your-email@gmail.com>"

# Application URLs (localhost for development)
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"
PORT=5000

# Environment
NODE_ENV="development"

# File Upload Settings
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_PATH="./uploads"
```

**Frontend (.env in frontend folder):**
```env
REACT_APP_API_URL="http://localhost:5000/api"
REACT_APP_BACKEND_URL="http://localhost:5000"
```

**Important Setup Notes:**
- Generate secure random keys using Node.js crypto module
- For Gmail SMTP, enable 2FA and create an App Password
- MySQL must be running in XAMPP (Apache and MySQL both started)
- Create database in phpMyAdmin: `eduauth_registry`
- Default XAMPP MySQL credentials: username=`root`, password=`` (empty)
- Never commit .env files to version control

---

## 📊 Database Schema

### Prisma Configuration

**prisma/schema.prisma:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### Core Models

```prisma
// User roles enum
enum UserRole {
  STUDENT
  INSTITUTION
  ADMIN
}

// User status enum
enum UserStatus {
  PENDING_VERIFICATION  // Email not verified
  PENDING_APPROVAL      // Email verified, waiting for admin
  APPROVED              // Active user
  REJECTED              // Denied by admin
  SUSPENDED             // Temporarily disabled
}

// Identity type enum
enum IdentityType {
  NID
  BIRTH_CERTIFICATE
}

// Institution type enum
enum InstitutionType {
  HIGH_SCHOOL
  COLLEGE
  TECHNICAL
  MADRASAH
  UNIVERSITY
  TRAINING_CENTRE
}

// Board enum
enum Board {
  COMILLA
  DHAKA
  DINAJPUR
  JESSORE
  MYMENSINGH
  RAJSHAHI
  SYLHET
  MADRASAH
  TECHNICAL
}

// Certificate type enum
enum CertificateType {
  // High School
  JSC
  SSC
  VOCATIONAL_SSC
  
  // College
  HSC
  VOCATIONAL_HSC
  BM
  
  // Madrasah
  JDC
  DAKHIL
  ALIM
  VOCATIONAL_MADRASAH
  
  // Technical
  DIPLOMA
  
  // University
  BSC
  MSC
  BA
  MA
  BBA
  MBA
  LLB
  LLM
  MBBS
  BDS
  
  // Training
  TRAINING_COMPLETION
  
  // Skill
  SKILL_CERTIFICATE
}

// Main User table (for authentication)
model User {
  id                String      @id @default(uuid())
  email             String      @unique
  password          String      // bcrypt hashed
  role              UserRole
  status            UserStatus  @default(PENDING_VERIFICATION)
  emailVerified     Boolean     @default(false)
  emailVerifyToken  String?     @unique
  emailVerifyExpiry DateTime?
  resetToken        String?     @unique
  resetTokenExpiry  DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relations
  student           Student?
  institution       Institution?
}

// Student profile
model Student {
  id                    String        @id @default(uuid())
  userId                String        @unique
  user                  User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Personal Info
  firstName             String
  middleName            String?
  lastName              String
  dateOfBirth           DateTime
  fatherName            String
  motherName            String
  
  // Identity (encrypted only - search by email instead)
  identityType          IdentityType
  nidEncrypted          String?                // AES-256 encrypted NID
  birthCertEncrypted    String?                // AES-256 encrypted Birth Certificate
  // Note: At least one identity must be provided
  
  // Contact
  phone                 String
  presentAddress        String
  
  // Documents
  nidOrBirthCertImage   String        // File path
  studentPhoto          String        // File path
  
  // Metadata
  studentId             String        @unique @default(uuid())  // Public ID for display
  rejectionReason       String?
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
  
  // Relations
  enrollments           Enrollment[]
  enrollmentRequests    EnrollmentRequest[]
  certificates          Certificate[]
  profileChangeRequests ProfileChangeRequest[]
  issueReports          IssueReport[]
}

// Institution profile
model Institution {
  id                    String            @id @default(uuid())
  userId                String            @unique
  user                  User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Basic Info
  name                  String
  type                  InstitutionType
  phone                 String
  address               String
  
  // Registration Details
  eiin                  String?           @unique  // 6 digits, required for schools/colleges/madrasah
  registrationNumber    String?           @unique  // Required for university/training
  board                 Board?                     // Null for university/training
  
  // Authority Info
  authorityName         String
  authorityTitle        String                     // Auto-set based on type
  authoritySignature    String                     // File path to signature image
  
  // Status
  canIssueCertificates  Boolean           @default(true)
  rejectionReason       String?
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
  
  // Relations
  enrollments           Enrollment[]
  enrollmentRequests    EnrollmentRequest[]
  certificates          Certificate[]
  programs              InstitutionProgram[]
  programRequests       ProgramRequest[]
  activityLogs          ActivityLog[]
}

// Enrollment (Institution claims a student)
model Enrollment {
  id                    String      @id @default(uuid())
  studentId             String
  student               Student     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  institutionId         String
  institution           Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  
  // Enrollment Details
  studentInstitutionId  String      // Student's ID in institution's system
  enrollmentDate        DateTime
  
  // Type-specific fields (nullable, fill based on institution type)
  department            String?     // For university/technical
  class                 String?     // For school/college/madrasah
  courseName            String?     // For training centre
  
  createdAt             DateTime    @default(now())
  
  @@unique([studentId, institutionId])
}

// Enrollment Requests (Student-initiated)
model EnrollmentRequest {
  id                    String      @id @default(uuid())
  studentId             String
  student               Student     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  institutionId         String
  institution           Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  
  // Request Details
  studentInstitutionId  String      // Student's ID in institution's system
  enrollmentDate        DateTime
  
  // Type-specific fields
  department            String?
  class                 String?
  courseName            String?
  
  // Supporting documents (JSON array of file paths)
  supportingDocs        String?     @db.Text
  
  // Status
  status                String      @default("PENDING")  // PENDING, APPROVED, REJECTED
  institutionComments   String?     @db.Text
  decidedAt             DateTime?
  decidedBy             String?     // Institution user ID who decided
  
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@unique([studentId, institutionId, status])  // Prevent duplicate pending requests
}

// Certificate Sequence (for generating serials)
model CertificateSequence {
  id                Int      @id @default(autoincrement())
  lastSequence      BigInt   @default(0) @db.BigInt
  updatedAt         DateTime @updatedAt
}

// Certificate
model Certificate {
  id                String          @id @default(uuid())
  
  // Core Info
  serial            String          @unique  // 7-character alphanumeric (e.g., A7K9M3X)
  sequenceNumber    BigInt          @db.BigInt  // The sequential number used to generate serial
  certificateType   CertificateType
  
  // Relations
  studentId         String
  student           Student         @relation(fields: [studentId], references: [id])
  institutionId     String
  institution       Institution     @relation(fields: [institutionId], references: [id])
  
  // Academic Details (nullable, fill based on type)
  // School/College/Madrasah
  rollNumber        String?
  registrationNumber String?
  examinationYear   Int?
  board             Board?
  group             String?        // For HSC: Science/Arts/Commerce
  gpa               Decimal?       @db.Decimal(3, 2)  // Max 5.00
  passingYear       Int?
  
  // Technical
  diplomaSubject    String?
  duration          String?
  session           String?
  
  // University
  program           String?
  department        String?
  major             String?
  cgpa              Decimal?       @db.Decimal(3, 2)  // Max 4.00
  degreeClass       String?        // First Class, Second Class, etc.
  convocationDate   DateTime?
  
  // Training
  completionDate    DateTime?
  
  // Skill Certificate
  skillName         String?
  
  // Issue Details
  issueDate         DateTime       @default(now())
  authorityName     String
  authorityTitle    String
  authoritySignature String        // Copy from institution at time of issue
  
  // Verification
  isPubliclyShareable Boolean      @default(true)  // Student can toggle
  qrCodeData        String                         // URL or data for QR
  
  // PDF
  pdfPath           String?                        // Generated PDF file path
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  @@index([serial])
  @@index([studentId])
  @@index([institutionId])
}

// Institution Programs (approved degree/training/skill programs)
model InstitutionProgram {
  id            String      @id @default(uuid())
  institutionId String
  institution   Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  
  programName   String
  programType   String      // degree, training, skill
  description   String?
  isActive      Boolean     @default(true)
  
  approvedAt    DateTime    @default(now())
  approvedBy    String?     // Admin ID who approved
  
  @@unique([institutionId, programName])
}

// Program Approval Requests
model ProgramRequest {
  id                String      @id @default(uuid())
  institutionId     String
  institution       Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  
  programName       String
  programType       String      // degree, training, skill
  description       String
  supportingDocs    String?     // JSON array of file paths
  
  status            String      @default("PENDING")  // PENDING, APPROVED, REJECTED
  adminComments     String?
  decidedAt         DateTime?
  decidedBy         String?     // Admin ID
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

// Profile Change Requests
model ProfileChangeRequest {
  id                String    @id @default(uuid())
  studentId         String
  student           Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  // Changes requested (JSON object with field: { old, new })
  changes           String    @db.Text  // Store as JSON
  
  // Supporting documents
  supportingDocs    String?   // JSON array of file paths
  reason            String    @db.Text
  
  // Status
  status            String    @default("PENDING")  // PENDING, APPROVED, REJECTED
  adminComments     String?   @db.Text
  decidedAt         DateTime?
  decidedBy         String?   // Admin ID
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

// Issue Reports (tickets)
model IssueReport {
  id            String    @id @default(uuid())
  ticketNumber  String    @unique
  
  // Reporter (nullable if from institution)
  studentId     String?
  student       Student?  @relation(fields: [studentId], references: [id])
  
  reporterEmail String
  reporterName  String
  
  issueType     String    // certificate_not_received, wrong_info, account_access, technical, other
  description   String    @db.Text
  attachments   String?   // JSON array of file paths
  
  // Status
  status        String    @default("NEW")  // NEW, IN_PROGRESS, RESOLVED, CLOSED
  adminResponse String?   @db.Text
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  resolvedAt    DateTime?
}

// Activity Logs
model ActivityLog {
  id            String      @id @default(uuid())
  
  actorId       String?
  actorType     String      // STUDENT, INSTITUTION, ADMIN, SYSTEM
  actorName     String
  
  action        String      // REGISTRATION, APPROVAL, REJECTION, CERTIFICATE_ISSUED, etc.
  targetType    String?     // STUDENT, INSTITUTION, CERTIFICATE, PROGRAM
  targetId      String?
  
  details       String?     @db.Text  // JSON with additional info
  ipAddress     String?
  
  institutionId String?
  institution   Institution? @relation(fields: [institutionId], references: [id])
  
  createdAt     DateTime    @default(now())
  
  @@index([actorId])
  @@index([createdAt])
}

// Admin (separate from User for security)
model Admin {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hashed
  name      String   @default("System Administrator")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🔢 Certificate Serial System (CRITICAL)

### Requirements
- **7-character alphanumeric format:** `A7K9M3X`
- **Base-36 encoding:** Uses 0-9 and A-Z (36 characters)
- **Structure:** 6 sequential characters + 1 check digit
- **Capacity:** 2.17 billion unique certificates
- **Case-insensitive:** `a7k9m3x` = `A7K9M3X`

### Implementation Algorithm

```javascript
// Serial generation function
async function generateCertificateSerial(prisma) {
  // Get next sequence number (transaction-safe)
  const sequence = await prisma.$transaction(async (tx) => {
    const seqRecord = await tx.certificateSequence.findFirst();
    
    if (!seqRecord) {
      // Initialize if doesn't exist
      await tx.certificateSequence.create({
        data: { lastSequence: 1 }
      });
      return 1;
    }
    
    const nextSeq = seqRecord.lastSequence + 1;
    await tx.certificateSequence.update({
      where: { id: seqRecord.id },
      data: { lastSequence: nextSeq }
    });
    
    return nextSeq;
  });
  
  // Convert to Base-36 (6 characters, padded)
  const base36 = sequence.toString(36).toUpperCase().padStart(6, '0');
  
  // Calculate check digit (weighted sum mod 36)
  const weights = [7, 3, 1, 7, 3, 1];  // Repeating pattern
  let sum = 0;
  
  for (let i = 0; i < 6; i++) {
    const char = base36[i];
    const value = parseInt(char, 36);  // Convert to number (0-35)
    sum += value * weights[i];
  }
  
  const checkDigit = (sum % 36).toString(36).toUpperCase();
  const serial = base36 + checkDigit;
  
  return { serial, sequenceNumber: sequence };
}

// Validation function
function validateCertificateSerial(serial) {
  // Check format
  if (!/^[0-9A-Z]{7}$/i.test(serial)) {
    return false;
  }
  
  const normalized = serial.toUpperCase();
  const base36 = normalized.substring(0, 6);
  const providedCheck = normalized[6];
  
  // Recalculate check digit
  const weights = [7, 3, 1, 7, 3, 1];
  let sum = 0;
  
  for (let i = 0; i < 6; i++) {
    const value = parseInt(base36[i], 36);
    sum += value * weights[i];
  }
  
  const calculatedCheck = (sum % 36).toString(36).toUpperCase();
  
  return providedCheck === calculatedCheck;
}
```

### Serial Examples
- `0000014` → Sequence 1
- `000002G` → Sequence 2
- `0000ZZX` → Sequence 1295
- `A7K9M3X` → Sequence 1234567890

---

## 👥 User Roles & Workflows

### 1. Student Role

#### Registration Flow
1. Student fills registration form:
   - firstName, middleName (optional), lastName
   - dateOfBirth
   - NID (10/13 digits) OR Birth Certificate (17 digits) - at least one required
   - fatherName, motherName
   - email (unique), phone, presentAddress
   - Upload: nidOrBirthCertImage (max 2MB), studentPhoto (max 500KB)
   - password, confirmPassword

2. Form validation:
   - Email format check
   - Strong password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
   - At least one identity document (NID or Birth Certificate)
   - File size and type validation

3. On submit:
   - Encrypt NID/Birth Certificate with AES-256 (store in `nidEncrypted` or `birthCertEncrypted`)
   - Store which type is primary in `identityType`
   - Create User with `status: PENDING_VERIFICATION`
   - Generate email verification token (32 chars, expires in 24 hours)
   - Send verification email with link

4. Email verification:
   - Student clicks link
   - Token validated and not expired
   - Update `emailVerified: true`, `status: PENDING_APPROVAL`
   - Admin notified of new registration

5. Admin approval:
   - Admin reviews all details and documents
   - Approves → Student can login, email sent
   - Rejects → Email sent with reason + all submitted data for corrections

#### Student Dashboard
- **Statistics Cards:**
  - Number of enrolled institutions
  - Total certificates received
  - Pending enrollment requests

- **Quick Actions:**
  - **Request Enrollment** button (prominent)
  - View My Certificates
  - Update Profile

- **Enrolled Institutions Section:**
  - List of institutions student is enrolled in
  - Show: Institution name, type, enrollment date, department/class
  - Status badge: Active/Pending

- **Pending Enrollment Requests:**
  - Show requests awaiting institution approval
  - Institution name, requested date, status
  - Cancel request option

- **My Certificates Section:**
  - Table/grid of all certificates
  - Show: Serial, Type, Institution, Issue Date, GPA/CGPA
  - Actions per certificate:
    - 📋 Copy Serial (one-click clipboard copy)
    - 📱 View QR Code (modal popup with QR)
    - 📄 Download PDF
    - 🔒 Toggle Sharing (on/off for public verification)

#### Request Enrollment Page (New Feature)
**Process:**
1. Search for institution:
   - Search by: Name, EIIN, or Registration Number
   - Show results with institution details

2. Select institution and fill form:
   - **studentInstitutionId:** Student's ID in that institution (e.g., roll number)
   - **enrollmentDate:** When they joined/want to enroll
   - **Type-specific fields:**
     - University/Technical: Department
     - School/College/Madrasah: Class
     - Training Centre: Course Name
   - **Supporting Documents:** Upload enrollment proof (optional but recommended)
     - Admission letter, fee receipt, ID card photo

3. Submit request:
   - Institution receives notification
   - Request appears in institution's pending list
   - Student can track status

4. Institution approval:
   - Institution reviews request and documents
   - Approves → Enrollment created, student notified
   - Rejects → Student notified with reason, can resubmit

**Benefits:**
- Students don't need to contact institution separately
- Institutions maintain control over enrollment
- Clear audit trail
- Reduces data entry errors

#### Student Profile Page
- Display all information (decrypt identity for display)
- Show which identity type is primary (NID or Birth Certificate)
- Profile photo with upload button
- **Instant Update (no approval needed):**
  - Profile photo (delete old from storage first)
  - Phone number
  
- **Update Requiring Approval:**
  - Name, DOB, NID/Birth Certificate, father's name, mother's name, address
  - Button: "Request Profile Update"

#### Submit Update Request Page
- Show current information
- Form with fields to update (checkboxes to select which)
- Side-by-side comparison: Current → New
- Upload supporting documents (required, max 3 files, 2MB each)
- Reason for change (textarea, min 20 characters)
- Validation: Only 1 pending request allowed per student
- On submit: Create ProfileChangeRequest

#### My Applications Page
- List all profile change requests
- Show: Request date, fields requested to change, status (pending/approved/rejected)
- View details modal showing current vs new values
- Admin comments if rejected

#### Change Password Page
- Current password field
- New password with strength indicator
- Confirm new password
- "Forgot Password?" link
- On success: Logout user, must login again

#### Report Issue Page
- Issue type dropdown: certificate_not_received, wrong_info, account_access, technical, other
- Description textarea (min 50 chars)
- Optional attachments (max 3 files, 2MB each)
- Generate unique ticket number (e.g., TKT-20240102-XXXX)
- Send confirmation email with ticket number

---

### 2. Institution Role

#### Registration Flow
1. Institution fills form:
   - name, email, phone, address
   - type: HIGH_SCHOOL | COLLEGE | TECHNICAL | MADRASAH | UNIVERSITY | TRAINING_CENTRE
   - eiin (6 digits, required for schools/colleges/madrasah)
   - registrationNumber (required for university/training)
   - board: COMILLA, DHAKA, DINAJPUR, JESSORE, MYMENSINGH, RAJSHAHI, SYLHET, MADRASAH, TECHNICAL
   - authorityName, Upload: authoritySignature (image, max 1MB PNG/JPG)
   - password, confirmPassword

2. **Critical Validation Rules:**
   - Madrasah type → MUST select Madrasah board only
   - Technical type → MUST select Technical board only
   - University & Training Centre → Board must be NULL
   - Other types → Select from general boards (not Madrasah/Technical)

3. **Auto-set Authority Title:**
   - HIGH_SCHOOL → "Head Teacher"
   - COLLEGE → "Principal"
   - TECHNICAL → "Principal"
   - MADRASAH → "Principal"
   - UNIVERSITY → "Vice Chancellor"
   - TRAINING_CENTRE → "Director"

4. Same email verification and admin approval flow as students

#### Institution Dashboard
- **Statistics Cards:**
  - Total enrolled students
  - Total certificates issued
  - Pending enrollment requests (badge with count)
  - Active programs (approved)

- **Pending Enrollment Requests Section:**
  - Table showing student requests awaiting approval
  - Show: Student name, email, institution ID, department/class, request date
  - Actions: View Details, Approve, Reject
  - Badge notification on navigation

- **Recent Activities:**
  - Last 10 certificates issued
  - Recent enrollments (approved)
  - Recent enrollment approvals/rejections

- **Accredited Programs Section:**
  - List approved programs
  - Button: "Request New Program Approval"

- **Quick Actions:**
  - Enroll Student (direct search method)
  - Review Enrollment Requests
  - Issue Certificate

#### Enroll Student Page

**Simplified Enrollment Process (Two Methods):**

**Method 1: Direct Search (Recommended)**
1. Search student by:
   - Email address (most reliable)
   - OR Full name + date of birth
   - OR Student ID (if already enrolled elsewhere)

2. System shows search results:
   - Display matching students with: Photo, Name, DOB, Email, Student ID
   - Show current enrollment status (if any)
   - "Select" button for each result

3. Once selected, enrollment form appears:
   - **All types:** studentInstitutionId (institution's internal ID), enrollmentDate
   - **University/Technical:** department (dropdown or text)
   - **High School/College/Madrasah:** class (dropdown: Class 1-12)
   - **Training Centre:** courseName
   - **Note:** Student receives email notification about enrollment
   
4. Validation:
   - Check if already enrolled (prevent duplicates)
   - Verify student is approved by admin
   - Institution must have certificate issuing permission

**Method 2: Student-Initiated Enrollment Request**
1. Student can request enrollment from their dashboard
2. Student searches for institution by name/EIIN
3. Student submits enrollment request with their institution ID
4. Institution receives notification
5. Institution approves/rejects request
6. Upon approval, enrollment is created

**Key Benefits of This Approach:**
- No complex hash matching needed
- Email is unique and easy to remember
- Students can initiate enrollment (reduces institution workload)
- Clear audit trail of who enrolled whom
- Prevents errors from mistyped ID numbers

#### My Students Page
- Search bar (by name, NID, institution ID)
- Filter by department/class/year
- Table showing:
  - Photo, Name, Institution ID, Department/Class, Enrollment Date
  - Number of certificates issued
  - Actions: View Details, Issue Certificate

- View Details modal:
  - Full student info
  - List of certificates issued to this student

- Export to CSV button

#### Issue Certificate Page
1. **Select Student:**
   - Dropdown of enrolled students (searchable)
   - Show: Name, Institution ID, Department/Class

2. **Select Certificate Type:**
   - Dropdown based on institution type:
     - High School: JSC, SSC, Vocational
     - College: HSC, Vocational, BM
     - Madrasah: JDC, Dakhil, Alim, Vocational
     - Technical: Diploma
     - University: BSc, MSc, BBA, MBA, etc. (from approved programs)
     - Training Centre: Training Completion (from approved programs)
     - Skill Certificates (all types, from approved programs)

3. **Dynamic Form Fields (based on certificate type):**

   **For High School (JSC, SSC, Vocational):**
   - rollNumber, registrationNumber, examinationYear
   - board (auto-filled from institution)
   - GPA (max 5.00)
   - passingYear

   **For College (HSC, Vocational, BM):**
   - rollNumber, registrationNumber, examinationYear
   - board (auto-filled)
   - group (dropdown: Science, Arts, Commerce) - only for HSC
   - GPA (max 5.00)
   - passingYear

   **For Madrasah (JDC, Dakhil, Alim, Vocational):**
   - rollNumber, registrationNumber, examinationYear
   - GPA (max 5.00)
   - passingYear

   **For Technical (Diploma):**
   - diplomaSubject
   - duration (e.g., "4 Years")
   - session (e.g., "2020-2024")
   - GPA (max 5.00)

   **For University (Degree programs):**
   - program (dropdown from approved programs)
   - department
   - session (e.g., "Spring 2020")
   - major
   - CGPA (max 4.00)
   - degreeClass (dropdown: First Class, Second Class Upper, Second Class Lower, Third Class)
   - convocationDate

   **For Training Centre (Completion certificates):**
   - program (dropdown from approved programs)
   - duration
   - completionDate
   - **NO GPA/CGPA field**

   **For Skill Certificates:**
   - skillName (dropdown from approved skill programs)
   - completionDate

4. **Certificate Generation:**
   - Generate serial using the algorithm
   - Auto-fill: issueDate (today), authorityName, authorityTitle, authoritySignature from institution
   - Generate QR code (URL: `https://eduauth.gov.bd/verify/${serial}`)
   - Create Certificate record
   - Generate PDF (see Certificate Design section)
   - Send email to student with certificate details and PDF link
   - Log activity

#### Request Program Approval Page
- Program name (text)
- Program type (dropdown: degree, training, skill)
- Description (textarea, min 50 chars)
- Upload supporting documents (required, max 3 files, 5MB each)
- On submit: Create ProgramRequest
- Show pending requests with status

#### Institution Profile Page
- View all institution details
- View accredited programs
- Change password option
- Report issue option

---

### 3. Admin Role

#### Admin Login
- **Hardcoded Credentials:**
  - Email: `eduauthregistry@gmail.com`
  - Password: `admin`
  - Create in seed script with bcrypt (12 rounds)

#### Admin Dashboard
- **Statistics Overview:**
  - Pending student registrations
  - Pending institution registrations
  - Pending profile change requests
  - Pending program approval requests
  - Total students (approved)
  - Total institutions (approved)
  - Total certificates issued

- **Pending Counts by Type:**
  - Student Registrations: X
  - Institution Registrations: Y
  - Profile Changes: Z
  - Program Approvals: W

- **Recent Activity Log:**
  - Last 20 activities from ActivityLog
  - Show: Time, Actor, Action, Target

- **Quick Access:**
  - Buttons to each pending section

#### Pending Requests Tab

**Sub-tabs:**
1. Student Registrations
2. Institution Registrations
3. Profile Change Requests
4. Program Approval Requests

**Student Registration Approval:**
- Table of pending students
- Columns: Name, Email, Registration Date, Identity Type, Actions
- View Details button opens modal:
  - All personal information
  - Preview of NID/Birth Certificate image
  - Preview of student photo
  - Registration timestamp
- Actions:
  - ✅ Approve → Update status, send approval email, log activity
  - ❌ Reject → Modal for rejection reason (required, min 20 chars)
    - Send rejection email with reason + all submitted data
    - Log activity

**Institution Registration Approval:**
- Same pattern as students
- View Details shows:
  - Institution info, type, board
  - Authority name, title
  - Preview authority signature
  - Validate EIIN/Registration number
- Approve/Reject with same flow

**Profile Change Requests:**
- Table showing: Student Name, Request Date, Fields to Change, Status
- View Details modal:
  - Side-by-side comparison table: Current → New
  - Preview supporting documents
  - Student's previous request count (history)
  - Reason provided by student
- Actions:
  - ✅ Approve → Update Student record with new values, send email, log
  - ❌ Reject → Comments field (required), send email with comments
- Mark as Processed

**Program Approval Requests:**
- Table: Institution Name, Program Name, Type, Request Date
- View Details modal:
  - Institution details and statistics
  - Program name, type, description
  - Preview supporting documents
  - Institution's current approved programs list
- Actions:
  - ✅ Approve → Create InstitutionProgram, send email, log
  - ❌ Reject → Comments field, send email

#### Approved Tab
- Sub-tabs: Students, Institutions, Programs
- Searchable, filterable lists
- Export to CSV functionality
- View full details of any approved item

#### Institutions Management Page
- List all institutions (approved, rejected, suspended)
- Search and filter capabilities
- For each institution, actions:
  - View Details → Show full info, statistics
  - View Students → List enrolled students
  - View Certificates → List all issued certificates
  - View Programs → List accredited programs
  - **Revoke Certificate Issuing Permission:**
    - Modal: Reason required (min 50 chars)
    - Set `canIssueCertificates: false`
    - Send email notification
    - Log activity
  - **Revoke Program Permission:**
    - Select program from dropdown
    - Reason required
    - Set program `isActive: false`
    - Send email
    - Log activity
  - **Grant Permission:** (if previously revoked)
    - Re-enable `canIssueCertificates`
    - Send email
    - Log activity

#### Activity Logs Page
- Comprehensive table of all ActivityLog records
- Columns: Time, Actor, Action, Target, IP Address, Details
- Filters:
  - Date range
  - Actor type (student, institution, admin, system)
  - Action type (registration, approval, certificate_issued, etc.)
  - Search by actor name or target
- Pagination (50 per page)
- Export to CSV
- View Details modal for JSON details

#### Issue Reports Management Page
- List all tickets
- Columns: Ticket Number, Reporter, Issue Type, Status, Created Date
- Filter by status: NEW, IN_PROGRESS, RESOLVED, CLOSED
- View Details modal:
  - Full ticket info
  - Conversation history (if any)
  - Attachments preview
- Actions:
  - Update Status
  - Add Response (textarea, sent via email to reporter)
  - Mark as Resolved
  - Close Ticket
- Search by ticket number or reporter email

---

### 4. Public Verification Portal

#### Landing Page

**Hero Section:**
- Large heading: "Verify Academic Credentials Instantly"
- Subheading: "Bangladesh's trusted platform for educational certificate verification"
- **Two CTA buttons:**
  - "Verify Certificate" (prominent, primary button)
  - "Login" (secondary button, opens login modal)
- Search bar for certificate serial (prominent)
- Background: Professional gradient or subtle pattern

**Statistics Section:**
- Cards showing:
  - X Institutions Registered
  - Y Verified Certificates
  - Z Students Enrolled
- Update dynamically from database

**Why EduAuth Section:**
- 4 feature cards with icons:
  1. ⚡ Instant Verification - Verify in seconds, not weeks
  2. 🔒 Secure & Tamper-Proof - Cryptographic hashing ensures authenticity
  3. 📱 QR Code Support - Scan and verify on any device
  4. 🏛️ Trusted by Institutions - Official verification platform

**How It Works Section:**
- 3 steps with illustrations:
  1. Institution Issues Certificate - Cryptographic seal applied
  2. Student Receives QR Code - Add to CV or LinkedIn
  3. Employer Verifies Instantly - Scan or enter serial

**Resources Section:**
- Links to:
  - User Manual (PDF)
  - FAQ Page
  - Contact Support
  - About EduAuth

**Login/Register Section:**
- Two buttons:
  - Login (opens modal with tabs: Student / Institution)
  - Register (link to registration page)

**Footer:**
- **Quick Links:** About, Contact, Help Center, User Guide
- **Legal:** Terms of Service, Privacy Policy, Cookie Policy
- **Customer Service:** Help Center, FAQs, Report Issue
- **Developer Section:**
  - "Developed by [Your Name]"
  - Links: GitHub, LinkedIn, WhatsApp (with icons)
  - Copyright: © 2024 EduAuth Registry
- **Contact:**
  - Email: support@eduauth.gov.bd
  - Phone: +880-XXX-XXXXXX

#### Login Modal
- Tabs: Student | Institution
- Email and password fields
- "Forgot Password?" link
- Login button
- "Don't have an account? Register" link

#### Registration Page
- Tabs: Student | Institution
- Full forms as specified in Registration Flow sections
- Step indicator if multi-step form
- Clear validation messages
- Submit button

#### Forgot Password Page
- Email input
- Send Reset Link button
- "Remember password? Login" link
- On submit:
  - Generate reset token (expires in 1 hour)
  - Send email with reset link: `https://eduauth.gov.bd/reset-password?token=xxx`
  - Confirmation message

#### Reset Password Page
- Validate token on page load
- If expired or invalid, show error
- If valid:
  - New password field with strength indicator
  - Confirm password field
  - Submit button
- On success:
  - Update password
  - Invalidate token
  - Redirect to login with success message

#### Verification Page

**Two Verification Methods:**

**Method 1: Manual Entry**
- Input field: Certificate Serial (7 characters)
- Auto-format as user types (remove spaces, convert to uppercase)
- Validate format (7 alphanumeric chars)
- "Verify" button

**Method 2: QR Code Scan**
- "Scan QR Code" button
- Opens camera with overlay
- Scan QR from certificate
- Auto-extracts serial and submits verification

**Verification Process:**
1. Validate serial format and check digit
2. Query database: `SELECT * FROM Certificate WHERE serial = ? AND isPubliclyShareable = true`
3. If found:
   - Display success UI
4. If not found or sharing disabled:
   - Display appropriate message

**Verification Result - Certificate Found:**
- ✅ **VERIFIED CERTIFICATE** (green banner)
- Professional card layout:
  - Certificate Type (large heading)
  - Serial Number (prominent, with copy button)
  - **Student Information:**
    - Full Name
    - Date of Birth
  - **Institution Information:**
    - Institution Name
    - Institution Type
  - **Academic Details:**
    - Program/Degree (if applicable)
    - Major/Department (if applicable)
    - GPA/CGPA with max value (e.g., "CGPA: 3.85/4.00")
    - Issue Date
    - Other relevant fields based on certificate type
  - **Authority:**
    - Issued by: Authority Name, Authority Title
- **Notice:**
  - "Certificate download not available for public verification. Only the certificate holder can download."
- **Actions:**
  - "Verify Another Certificate" button
  - "Print Verification" button (opens print-friendly page)

**Verification Result - Not Found:**
- ❌ **CERTIFICATE NOT FOUND** (red banner)
- **Possible reasons:**
  - Serial number incorrect or mistyped
  - Certificate not yet issued
  - Certificate has been revoked
  - Sharing disabled by certificate holder
- **Actions:**
  - "Try Again" button
  - "Report Issue" link

**Verification Result - Sharing Disabled:**
- ⚠️ **CERTIFICATE NOT AVAILABLE** (yellow banner)
- Message: "This certificate is not available for public verification per the certificate holder's privacy settings."
- "Certificate holders can enable sharing in their profile."

---

## 📧 Email System

### Email Templates (HTML)

Create professional, responsive HTML email templates with:
- Clean design, consistent branding
- Mobile-friendly
- Clear call-to-action buttons
- Professional header and footer

**Required Templates:**

1. **Email Verification (Registration)**
   - Subject: "Verify Your Email - EduAuth Registry"
   - Content: Welcome message, verification link (button), expires in 24 hours
   - Link: `${FRONTEND_URL}/verify-email?token=xxx`

2. **Registration Approved (Student/Institution)**
   - Subject: "Your Registration Has Been Approved"
   - Content: Congratulations, login credentials reminder, next steps
   - CTA: "Login Now" button

3. **Registration Rejected (Student/Institution)**
   - Subject: "Registration Status Update"
   - Content: Apology, rejection reason, all submitted data for review, "You may re-register" message
   - CTA: "Register Again" button

4. **Certificate Issued (Student)**
   - Subject: "New Certificate Issued - [Certificate Type]"
   - Content: Congratulations, certificate details, serial number, download link
   - CTA: "View Certificate" button

5. **Profile Change Request Received (Student)**
   - Subject: "Profile Update Request Received"
   - Content: Confirmation of request submission, estimated review time (3-5 days)

6. **Profile Change Approved (Student)**
   - Subject: "Profile Update Approved"
   - Content: Changes approved, summary of updated fields

7. **Profile Change Rejected (Student)**
   - Subject: "Profile Update Request - Action Required"
   - Content: Rejection reason, admin comments, resubmission guidance

8. **Program Approval Decision (Institution)**
   - Subject: "Program Approval - [Program Name]"
   - Content: Decision (approved/rejected), admin comments, next steps

9. **Password Reset**
   - Subject: "Reset Your Password - EduAuth Registry"
   - Content: Reset link (expires in 1 hour), security notice
   - Link: `${FRONTEND_URL}/reset-password?token=xxx`

10. **Permission Revoked (Institution)**
    - Subject: "Important: Certificate Issuing Permission Update"
    - Content: Permission revoked, reason, contact admin for appeal

11. **Issue Ticket Confirmation (Student/Institution)**
    - Subject: "Support Ticket Created - [Ticket Number]"
    - Content: Ticket number, issue summary, expected response time

### Email Service Setup (Nodemailer)

```javascript
// utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"EduAuth Registry" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

module.exports = { sendEmail };
```

---

## 🎓 Certificate PDF Design

### Layout Requirements

**A4 Size, Portrait Orientation**

**Header Section:**
- Institution logo (if available) - centered, 60x60px
- Institution name - large, bold, centered
- Certificate type as main heading - centered, 24pt

**Serial Number:**
- Top-right corner, prominent
- Format: `Serial No: A7K9M3X`
- QR code next to it (80x80px)

**Body Section:**
- "This is to certify that" - centered
- Student full name - large, bold, centered
- Date of birth - smaller, centered
- Main content paragraph with academic details:
  - For University: "has successfully completed [Program] in [Major] from [Department]"
  - For School: "has passed [Exam] from [Board] in [Year]"
  - Include GPA/CGPA prominently

**Academic Details Table (if applicable):**
- Clean table with certificate details:
  - Roll Number, Registration Number, Examination Year, Board (if applicable)
  - GPA/CGPA with max value clearly shown (e.g., "GPA: 4.75 / 5.00")
  - Session, Department, Program (for university)

**Issue Details:**
- Issue Date - centered
- "Date of Issue: January 02, 2026"

**Footer Section:**
- Authority signature image (150x50px)
- Authority name and title - centered
- Horizontal line separator
- Verification footer:
  - "Verified through Bangladesh Educational Certificate Verification System"
  - Verification URL: `https://eduauth.gov.bd/verify/${serial}`
  - Watermark text: "DIGITALLY VERIFIED" (diagonal, semi-transparent)

### Design Principles
- Professional and elegant
- Clear hierarchy of information
- Easy to read (minimum 10pt font)
- Suitable for printing and framing
- QR code scannable when printed
- Consistent with certificate type

### PDF Generation Libraries
Use one of:
- **PDFKit** (recommended) - Node.js library for PDF generation
- **jsPDF** - JavaScript library
- **pdf-lib** - Manipulate and create PDFs

### Sample Certificate Structure

```
┌─────────────────────────────────────────┐
│         [Institution Logo]              │
│                                         │
│       DHAKA UNIVERSITY                  │ Serial No: A7K9M3X [QR]
│                                         │
│   Bachelor of Science Certificate      │
│                                         │
│     This is to certify that            │
│                                         │
│         JOHN DOE SMITH                 │
│     Date of Birth: 15/08/2000          │
│                                         │
│   has successfully completed Bachelor  │
│   of Science in Computer Science and   │
│   Engineering from the Department of   │
│   CSE with CGPA 3.85 out of 4.00       │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Student ID:      CS-2018-001    │   │
│ │ Session:         Spring 2018    │   │
│ │ CGPA:            3.85 / 4.00    │   │
│ │ Degree Class:    First Class    │   │
│ │ Convocation:     10 Dec 2023    │   │
│ └─────────────────────────────────┘   │
│                                         │
│      Date of Issue: 02 Jan 2024        │
│                                         │
│                                         │
│       [Authority Signature]             │
│          Dr. Jane Smith                 │
│          Vice Chancellor                │
│                                         │
├─────────────────────────────────────────┤
│ Verified through Bangladesh Educational │
│    Certificate Verification System      │
│  Verify at: eduauth.gov.bd/verify       │
└─────────────────────────────────────────┘
```

---

## 🔧 Implementation Details

### Project Structure

```
eduauth-registry/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── email.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── rateLimiter.js
│   │   │   └── uploadMiddleware.js
│   │   ├── utils/
│   │   │   ├── encryption.js
│   │   │   ├── serialGenerator.js
│   │   │   ├── emailService.js
│   │   │   ├── pdfGenerator.js
│   │   │   └── qrGenerator.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── student.js
│   │   │   ├── institution.js
│   │   │   ├── admin.js
│   │   │   └── verification.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── studentController.js
│   │   │   ├── institutionController.js
│   │   │   ├── adminController.js
│   │   │   └── verificationController.js
│   │   └── server.js
│   ├── uploads/
│   │   ├── students/
│   │   ├── institutions/
│   │   └── certificates/
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── assets/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Loading.jsx
│   │   │   │   └── Toast.jsx
│   │   │   ├── student/
│   │   │   │   ├── StudentDashboard.jsx
│   │   │   │   ├── StudentProfile.jsx
│   │   │   │   └── ...
│   │   │   ├── institution/
│   │   │   │   ├── InstitutionDashboard.jsx
│   │   │   │   ├── EnrollStudent.jsx
│   │   │   │   └── ...
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   └── ...
│   │   │   └── public/
│   │   │       ├── LandingPage.jsx
│   │   │       ├── VerificationPage.jsx
│   │   │       └── ...
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
└── README.md (main project readme)
```

### Key Implementation Files

#### 1. Encryption Utility (`backend/src/utils/encryption.js`)

```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 64 hex chars = 32 bytes
const ENCRYPTION_IV = Buffer.from(process.env.ENCRYPTION_IV, 'hex');   // 32 hex chars = 16 bytes

function encryptIdentity(identity) {
  if (!identity) return null;
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, ENCRYPTION_IV);
  let encrypted = cipher.update(identity, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptIdentity(encryptedIdentity) {
  if (!encryptedIdentity) return null;
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, ENCRYPTION_IV);
  let decrypted = decipher.update(encryptedIdentity, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encryptIdentity, decryptIdentity };
```

#### 2. Serial Generator (`backend/src/utils/serialGenerator.js`)

Use the algorithm provided in the Certificate Serial System section.

#### 3. Auth Middleware (`backend/src/middleware/auth.js`)

```javascript
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // { id, email, role }
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
```

#### 4. Rate Limiter (`backend/src/middleware/rateLimiter.js`)

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});

const verificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many verification attempts, please try again later.',
});

module.exports = { loginLimiter, apiLimiter, verificationLimiter };
```

#### 5. File Upload Middleware (`backend/src/middleware/uploadMiddleware.js`)

```javascript
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (req.baseUrl.includes('student')) {
      uploadPath += 'students/';
    } else if (req.baseUrl.includes('institution')) {
      uploadPath += 'institutions/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF allowed.'), false);
  }
};

// Upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

module.exports = upload;
```

### API Endpoints Structure

#### Authentication Routes (`/api/auth`)
- `POST /api/auth/register/student` - Student registration
- `POST /api/auth/register/institution` - Institution registration
- `GET /api/auth/verify-email?token=xxx` - Email verification
- `POST /api/auth/login` - Login (student/institution)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

#### Student Routes (`/api/student`) - All require authentication
- `GET /api/student/dashboard` - Dashboard data
- `GET /api/student/profile` - Get profile
- `PUT /api/student/profile/photo` - Update photo
- `PUT /api/student/profile/phone` - Update phone
- `POST /api/student/profile/request-update` - Submit profile change request
- `GET /api/student/profile/requests` - Get all profile change requests
- `GET /api/student/certificates` - Get all certificates
- `PUT /api/student/certificates/:id/sharing` - Toggle sharing
- `POST /api/student/change-password` - Change password
- `POST /api/student/report-issue` - Submit issue report

#### Institution Routes (`/api/institution`) - All require authentication
- `GET /api/institution/dashboard` - Dashboard data
- `GET /api/institution/profile` - Get profile
- `POST /api/institution/enroll` - Enroll student
- `GET /api/institution/students` - Get enrolled students
- `GET /api/institution/students/:id` - Get student details
- `POST /api/institution/certificates/issue` - Issue certificate
- `GET /api/institution/certificates` - Get all issued certificates
- `POST /api/institution/programs/request` - Request program approval
- `GET /api/institution/programs` - Get approved programs
- `POST /api/institution/change-password` - Change password
- `POST /api/institution/report-issue` - Submit issue report

#### Admin Routes (`/api/admin`) - All require admin authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/pending/students` - Pending student registrations
- `POST /api/admin/pending/students/:id/approve` - Approve student
- `POST /api/admin/pending/students/:id/reject` - Reject student
- `GET /api/admin/pending/institutions` - Pending institution registrations
- `POST /api/admin/pending/institutions/:id/approve` - Approve institution
- `POST /api/admin/pending/institutions/:id/reject` - Reject institution
- `GET /api/admin/pending/profile-changes` - Pending profile change requests
- `POST /api/admin/pending/profile-changes/:id/approve` - Approve change
- `POST /api/admin/pending/profile-changes/:id/reject` - Reject change
- `GET /api/admin/pending/programs` - Pending program requests
- `POST /api/admin/pending/programs/:id/approve` - Approve program
- `POST /api/admin/pending/programs/:id/reject` - Reject program
- `GET /api/admin/institutions` - All institutions
- `PUT /api/admin/institutions/:id/revoke-permission` - Revoke issuing permission
- `PUT /api/admin/institutions/:id/grant-permission` - Grant issuing permission
- `PUT /api/admin/institutions/:id/programs/:programId/revoke` - Revoke program
- `GET /api/admin/activity-logs` - Get activity logs
- `GET /api/admin/reports` - Get issue reports
- `PUT /api/admin/reports/:id` - Update report status
- `POST /api/admin/reports/:id/respond` - Respond to report

#### Verification Routes (`/api/verify`) - Public, no authentication
- `POST /api/verify/certificate` - Verify certificate by serial
- `GET /api/verify/stats` - Get public statistics

---

## 📱 Responsive Design Breakpoints

```css
/* Mobile First Approach */

/* Extra Small Devices (phones, <576px) */
@media (max-width: 575.98px) {
  /* Stack elements vertically */
  /* Larger touch targets (min 44px) */
  /* Simplified navigation */
}

/* Small Devices (landscape phones, ≥576px) */
@media (min-width: 576px) {
  /* Slightly wider containers */
}

/* Medium Devices (tablets, ≥768px) */
@media (min-width: 768px) {
  /* 2-column layouts */
  /* Side-by-side forms */
}

/* Large Devices (desktops, ≥992px) */
@media (min-width: 992px) {
  /* 3-column layouts */
  /* Sidebar navigation */
}

/* Extra Large Devices (large desktops, ≥1200px) */
@media (min-width: 1200px) {
  /* Max width containers */
  /* More whitespace */
}
```

---

## 🧪 Testing Checklist

### Student Flow
- [ ] Register with NID
- [ ] Register with Birth Certificate
- [ ] Verify email
- [ ] Login after approval
- [ ] View dashboard
- [ ] Update profile photo
- [ ] Update phone number
- [ ] Submit profile change request with documents
- [ ] View certificates
- [ ] Toggle certificate sharing
- [ ] Copy serial number
- [ ] Download certificate PDF
- [ ] View QR code
- [ ] Change password
- [ ] Report issue

### Institution Flow
- [ ] Register (all types)
- [ ] Board validation based on type
- [ ] Authority title auto-set
- [ ] Verify email
- [ ] Login after approval
- [ ] Enroll student by NID
- [ ] Enroll student by Birth Certificate
- [ ] View enrolled students
- [ ] Issue certificate (all types)
- [ ] Request program approval
- [ ] View issued certificates
- [ ] Change password
- [ ] Report issue

### Admin Flow
- [ ] Login with hardcoded credentials
- [ ] View dashboard statistics
- [ ] Approve student registration
- [ ] Reject student registration with reason
- [ ] Approve institution registration
- [ ] Reject institution registration with reason
- [ ] Approve profile change request
- [ ] Reject profile change request
- [ ] Approve program request
- [ ] Reject program request
- [ ] Revoke institution permission
- [ ] Grant institution permission
- [ ] Revoke program permission
- [ ] View activity logs
- [ ] Filter and search logs
- [ ] Manage issue reports
- [ ] Respond to tickets

### Verification Flow
- [ ] Manual serial entry
- [ ] QR code scan
- [ ] Verify valid certificate
- [ ] Certificate not found message
- [ ] Sharing disabled message
- [ ] Print verification
- [ ] Verify another certificate

### Security Testing
- [ ] Password hashing works
- [ ] Identity hashing works
- [ ] Identity encryption/decryption works
- [ ] JWT authentication works
- [ ] Role-based access control works
- [ ] Rate limiting works
- [ ] File upload validation works
- [ ] XSS prevention works
- [ ] SQL injection prevention works (Prisma handles this)

### Email Testing
- [ ] Registration verification email
- [ ] Approval email
- [ ] Rejection email with reason
- [ ] Certificate issued email
- [ ] Profile change emails
- [ ] Program approval emails
- [ ] Password reset email
- [ ] Permission revoked email
- [ ] Ticket confirmation email

### Certificate Testing
- [ ] Serial generation works (no duplicates)
- [ ] Serial validation works
- [ ] Check digit validation works
- [ ] PDF generation works
- [ ] QR code generation works
- [ ] Certificate displays correctly
- [ ] All certificate types render properly

---

## 📝 Documentation Requirements

### README.md (Main)
```markdown
# EduAuth Registry

Bangladesh's Centralized Digital Trust Platform for Academic Credentials

## Features
- Instant certificate verification
- Secure cryptographic hashing
- QR code support
- Multi-role system (Student, Institution, Admin)
- Professional certificate generation

## Tech Stack
- Backend: Node.js, Express, PostgreSQL, Prisma
- Frontend: React, Tailwind CSS
- Security: JWT, Bcrypt, AES-256, SHA-256
- Email: Nodemailer
- PDF: PDFKit

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup
1. Clone repository
2. Install dependencies
3. Configure .env files
4. Run migrations
5. Seed admin account
6. Start servers

[Detailed instructions...]

## Environment Variables
[List all required variables...]

## API Documentation
[Link to API docs or inline documentation...]

## User Guide
[Link to user manual PDF...]

## License
MIT

## Contact
[Your contact information]
```

### User Manual (PDF)
Create comprehensive guide covering:
- How to register (with screenshots)
- How to verify email
- How to enroll students
- How to issue certificates
- How to verify certificates
- Troubleshooting common issues
- FAQ section

---

## 🚀 Deployment Considerations

### Environment Setup
- Production `.env` with secure values
- Database connection pooling
- Redis for session management (optional)
- File storage: Local or cloud (AWS S3, Cloudinary)

### Security Hardening
- HTTPS only
- CORS configuration
- Helmet.js for HTTP headers
- Input sanitization
- SQL injection prevention (Prisma handles this)
- XSS prevention
- CSRF protection

### Performance Optimization
- Database indexing
- Query optimization
- Image compression
- Lazy loading
- CDN for static assets
- Caching strategy (Redis recommended)

### Monitoring
- Error logging (Winston or similar)
- Performance monitoring
- Uptime monitoring
- Database backup strategy

---

## 🎯 Success Criteria

Your implementation will be considered successful when:

1. ✅ **Certificate serial system works flawlessly**
   - Generates unique 7-character serials
   - Check digit validation works
   - No duplicate serials ever generated

2. ✅ **All user flows work end-to-end**
   - Students can register, enroll, receive certificates
   - Institutions can enroll students and issue certificates
   - Admin can approve/reject all requests
   - Public can verify certificates instantly

3. ✅ **Security is rock-solid**
   - Passwords hashed with bcrypt
   - Identity numbers protected (hashed + encrypted)
   - JWT authentication working
   - Rate limiting active
   - File uploads validated

4. ✅ **UI is professional and responsive**
   - Works perfectly on mobile, tablet, desktop
   - Modern design that looks trustworthy
   - Clear user feedback (loading states, errors, success)
   - Accessible (keyboard navigation, screen readers)

5. ✅ **Email system works reliably**
   - All notification emails sent
   - Professional HTML templates
   - Links work correctly

6. ✅ **Certificates are beautiful and functional**
   - Professional PDF design
   - QR codes work when scanned
   - All information displayed correctly
   - Printable and frameable

7. ✅ **Code quality is excellent**
   - Clean, commented code
   - Proper error handling
   - No console errors
   - Follows best practices

8. ✅ **Documentation is complete**
   - README with setup instructions
   - User manual created
   - Code comments where needed

---

## 💡 Additional Notes

### Best Practices
- Write clean, self-documenting code
- Use meaningful variable/function names
- Add comments for complex logic
- Handle all error cases gracefully
- Provide user-friendly error messages
- Log important events
- Test thoroughly before considering complete

### Common Pitfalls to Avoid
- Don't store passwords in plain text (use bcrypt)
- Don't store identity numbers in plain text (hash + encrypt)
- Don't expose sensitive data in API responses
- Don't skip input validation
- Don't forget to delete old files when uploading new ones
- Don't use synchronous operations in production
- Don't hardcode values (use environment variables)
- Don't trust client-side validation alone

### Performance Tips
- Use database indexes on frequently queried fields
- Implement pagination for large lists
- Compress images on upload
- Cache frequently accessed data
- Use connection pooling for database
- Optimize SQL queries (use Prisma's query optimization)

### Scalability Considerations
- Design for horizontal scaling
- Use message queues for heavy operations (optional)
- Implement proper logging and monitoring
- Plan for database sharding (future)
- Consider microservices architecture (future)

---

---

## 🖥️ Local Development Setup

### Prerequisites Installation

**1. Install Node.js (v18 or higher)**
```bash
# Check if installed
node --version
npm --version

# If not installed, download from https://nodejs.org/
```

**2. Install XAMPP (includes MySQL)**
```bash
# Download XAMPP from https://www.apachefriends.org/

# Windows
# 1. Download XAMPP installer for Windows
# 2. Run installer and select Apache + MySQL components
# 3. Install to default location (C:\xampp)

# macOS
# 1. Download XAMPP for macOS
# 2. Open .dmg file and drag XAMPP to Applications
# 3. Open XAMPP and start Apache + MySQL

# Linux
# 1. Download XAMPP for Linux (.run file)
# 2. Make it executable: chmod +x xampp-linux-*-installer.run
# 3. Run: sudo ./xampp-linux-*-installer.run
# 4. Start: sudo /opt/lampp/lampp start
```

**3. Start XAMPP and Create Database**
```bash
# Start XAMPP Control Panel
# - Windows: Open XAMPP Control Panel from Start Menu
# - macOS: Open XAMPP from Applications
# - Linux: sudo /opt/lampp/lampp start

# Start Services:
# 1. Click "Start" for Apache
# 2. Click "Start" for MySQL

# Access phpMyAdmin:
# Open browser: http://localhost/phpmyadmin

# Create Database:
# 1. Click "New" in left sidebar
# 2. Database name: eduauth_registry
# 3. Collation: utf8mb4_unicode_ci (recommended for international characters)
# 4. Click "Create"
```

**Alternative: Create Database via Command Line**
```bash
# Windows (in XAMPP directory)
cd C:\xampp\mysql\bin
mysql -u root -p

# macOS/Linux
/Applications/XAMPP/bin/mysql -u root -p
# OR
mysql -u root -p

# In MySQL prompt:
CREATE DATABASE eduauth_registry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;  # Verify creation
EXIT;
\q
```

### Project Setup

**1. Create Project Structure**
```bash
mkdir eduauth-registry
cd eduauth-registry

# Create folders
mkdir backend frontend
```

**2. Backend Setup**
```bash
cd backend

# Initialize Node project
npm init -y

# Install core dependencies
npm install express prisma @prisma/client
npm install bcryptjs jsonwebtoken
npm install nodemailer
npm install cors helmet express-rate-limit
npm install multer uuid
npm install dotenv
npm install qrcode pdfkit

# Install development dependencies
npm install --save-dev nodemon prettier eslint

# Initialize Prisma
npx prisma init

# Create folder structure
mkdir -p src/{config,middleware,utils,routes,controllers}
mkdir -p uploads/{students,institutions,certificates}
mkdir -p emails/templates
```

**3. Frontend Setup**
```bash
cd ../frontend

# Create React app with Vite (faster than CRA)
npm create vite@latest . -- --template react

# Install UI dependencies
npm install
npm install react-router-dom
npm install axios react-query
npm install tailwindcss postcss autoprefixer
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
npm install date-fns

# Install shadcn/ui (after Tailwind setup)
npx shadcn-ui@latest init

# Install specific shadcn components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
```

**4. Configure Tailwind CSS**
```bash
cd frontend
npx tailwindcss init -p
```

Edit `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E40AF',
          hover: '#1E3A8A',
          light: '#3B82F6',
        },
        secondary: {
          DEFAULT: '#059669',
          hover: '#047857',
        },
        certificate: '#D97706',
        verified: '#059669',
      },
    },
  },
  plugins: [],
}
```

**5. Important MySQL/XAMPP Configuration Notes**

**Database Connection String Format:**
```env
# Default XAMPP (no password)
DATABASE_URL="mysql://root:@localhost:3306/eduauth_registry"

# If you set a MySQL password
DATABASE_URL="mysql://root:your_password@localhost:3306/eduauth_registry"

# Connection string format:
# mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
```

**MySQL-Specific Prisma Considerations:**
- Use `@db.BigInt` for large numbers (not just `BigInt`)
- Text fields: Use `@db.Text` or `@db.LongText` for large text
- DateTime fields work automatically
- Enums are created as MySQL ENUM types
- UUIDs work with `@default(uuid())` (Prisma generates them)

**XAMPP Port Configuration:**
- MySQL runs on port **3306** (default)
- Apache runs on port **80** (for phpMyAdmin)
- If port conflicts occur, change in XAMPP config
- Access phpMyAdmin: `http://localhost/phpmyadmin`

**6. Environment Configuration**

Create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/eduauth_registry"
JWT_SECRET="generate-32-char-secret-key"
ENCRYPTION_KEY="generate-64-char-hex-key"
ENCRYPTION_IV="generate-32-char-hex-key"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"
PORT=5000
NODE_ENV="development"
```

Create `frontend/.env`:
```env
VITE_API_URL="http://localhost:5000/api"
VITE_BACKEND_URL="http://localhost:5000"
```

**6. Generate Encryption Keys**
```bash
# In backend directory
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_IV=' + require('crypto').randomBytes(16).toString('hex'))"

# Copy the output to your .env file
```

**7. Gmail App Password Setup**
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate new app password
5. Copy to SMTP_PASSWORD in .env

### Running the Application

**1. Setup Database**
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed admin account
npx prisma db seed
# OR create seed script: node prisma/seed.js
```

**2. Start Backend**
```bash
cd backend
npm run dev
# OR
nodemon src/server.js

# Server should start on http://localhost:5000
```

**3. Start Frontend** (in new terminal)
```bash
cd frontend
npm run dev

# App should start on http://localhost:3000
```

**4. Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Admin Login: eduauthregistry@gmail.com / admin

### Development Workflow

**1. Database Changes**
```bash
# After modifying schema.prisma
npx prisma migrate dev --name migration_name
npx prisma generate
```

**2. View Database**
```bash
# Launch Prisma Studio (database GUI)
npx prisma studio
# Opens at http://localhost:5555
```

**3. Backend Development**
```bash
# Auto-restart on file changes
nodemon src/server.js

# Format code
npx prettier --write .
```

**4. Frontend Development**
```bash
# Vite hot reload is automatic
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Common Issues & Solutions

**Issue: Database connection failed**
```bash
# Check if XAMPP MySQL is running
# 1. Open XAMPP Control Panel
# 2. Verify MySQL shows "Running" status (green indicator)
# 3. If not running, click "Start" button for MySQL

# Test MySQL connection
# Windows (in XAMPP directory):
cd C:\xampp\mysql\bin
mysql -u root -p
# Press Enter when asked for password (default is empty)

# macOS:
/Applications/XAMPP/bin/mysql -u root -p

# Inside MySQL, test database:
SHOW DATABASES;
USE eduauth_registry;
SHOW TABLES;

# Check MySQL port (should be 3306)
# In XAMPP Control Panel, click "Config" for MySQL → my.ini
# Look for: port=3306

# If MySQL won't start:
# - Check if port 3306 is already in use
# - Disable other MySQL instances
# - Check XAMPP error logs: xampp/mysql/data/mysql_error.log
```

**Issue: Port already in use**
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>
```

**Issue: Prisma errors**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: CORS errors**
- Ensure FRONTEND_URL in backend .env matches frontend URL
- Check CORS configuration in backend server.js

**Issue: Email not sending**
- Verify Gmail app password (not regular password)
- Check SMTP settings in .env
- Enable "Less secure app access" if not using app password (not recommended)

### Testing Checklist

**Before starting development:**
- [ ] XAMPP is installed
- [ ] Apache is running in XAMPP (port 80)
- [ ] MySQL is running in XAMPP (port 3306)
- [ ] Database `eduauth_registry` is created in phpMyAdmin
- [ ] .env files are configured with correct MySQL connection string
- [ ] Dependencies are installed (`npm install`)
- [ ] Prisma is generated (`npx prisma generate`)
- [ ] Database is migrated (`npx prisma migrate dev`)
- [ ] Admin account is seeded

**During development:**
- [ ] Backend API is accessible at http://localhost:5000
- [ ] Frontend is accessible at http://localhost:3000
- [ ] Database changes are migrated
- [ ] Email service is configured and tested
- [ ] File uploads are working
- [ ] Authentication is working

---

## 🎬 Getting Started Guide for Codex

### Step-by-Step Implementation

**Phase 1: Foundation (Day 1-2)**
1. Set up project structure (backend + frontend)
2. Initialize package.json files
3. Create Prisma schema
4. Set up environment variables
5. Create utility functions (encryption, serial generation)
6. Set up authentication middleware
7. Create email service

**Phase 2: Backend Core (Day 3-4)**
8. Implement authentication routes (register, login, verify, reset password)
9. Implement student routes
10. Implement institution routes
11. Implement admin routes
12. Implement verification routes
13. Add rate limiting
14. Add file upload handling
15. Create seed script with admin account

**Phase 3: Frontend Core (Day 5-6)**
16. Set up React app with routing
17. Create common components (Header, Footer, Loading, Toast)
18. Build landing page
19. Build login/register pages
20. Build student portal pages
21. Build institution portal pages
22. Build admin portal pages
23. Build verification page

**Phase 4: Advanced Features (Day 7-8)**
24. Implement certificate PDF generation
25. Implement QR code generation
26. Create email templates
27. Implement activity logging
28. Implement issue reporting system
29. Add profile change request workflow
30. Add program approval workflow

**Phase 5: Polish & Testing (Day 9-10)**
31. Responsive design refinement
32. Cross-browser testing
33. Security audit
34. Performance optimization
35. Error handling improvements
36. User experience enhancements
37. Documentation completion
38. Final testing checklist

---

## 📧 Contact & Support

If you encounter any issues during implementation:
1. Check the documentation first
2. Review similar implementations
3. Test each component individually
4. Use console logging for debugging
5. Ask for clarification if requirements are unclear

---

## 🎓 Final Words

You're building something important - a system that will help protect the integrity of academic credentials in Bangladesh. Take your time, focus on quality, and create something that will make institutions, students, and employers trust the platform.

**Build with pride. Code with purpose. Deploy with confidence.**

Good luck! 🚀🇧🇩

---

**Document Version:** 1.0
**Last Updated:** January 2, 2026
**Status:** Ready for Implementation
