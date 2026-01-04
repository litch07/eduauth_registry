# EduAuth Registry - Quick Reference for Codex

> **⚠️ IMPORTANT: This project uses MySQL with XAMPP, NOT PostgreSQL!**
> - Database: MySQL 
> - Server: XAMPP (http://localhost/phpmyadmin)
> - Connection: `mysql://root:@localhost:3306/eduauth_registry`

## 🎯 Critical Changes from Original Refactor

### 1. **Identity Management - SIMPLIFIED** ✅
- **REMOVED:** SHA-256 hash-based identity matching
- **KEPT:** AES-256 encryption only for secure storage
- **WHY:** Hash matching is complex and unnecessary
- **NEW APPROACH:** Search students by email (unique, simple, reliable)

### 2. **Enrollment System - TWO METHODS** ✅
**Method 1: Institution-Initiated (Direct Search)**
- Institution searches student by email/name/DOB
- Select student from results
- Fill enrollment form
- Instant enrollment (no request needed)

**Method 2: Student-Initiated (Request System)**
- Student searches for institution
- Submits enrollment request with documents
- Institution approves/rejects
- Creates enrollment upon approval

### 3. **Technology Stack - FINALIZED** ✅
**Backend:**
- Node.js + Express.js
- MySQL + mysql2 (raw SQL)
- JWT + Bcrypt for auth
- Nodemailer for emails
- QRCode + PDFKit for certificates

**Frontend:**
- React 18 + React Router v6
- **shadcn/ui** (professional, accessible components)
- Tailwind CSS v3
- React Query (TanStack Query)
- React Hook Form + Zod
- Axios for API calls

### 4. **Color Scheme - FINALIZED** ✅
**Professional Academic Palette:**
- Primary: `#1E40AF` (Deep Blue) - Trust & authority
- Secondary: `#059669` (Emerald Green) - Verification & success
- Background: `#F9FAFB` (Light Gray)
- Success: `#10B981`, Warning: `#F59E0B`, Error: `#EF4444`

### 5. **Environment - LOCALHOST with XAMPP** ✅
**Backend runs on:** `http://localhost:5000`
**Frontend runs on:** `http://localhost:3000`
**Database:** MySQL on `localhost:3306` (via XAMPP)
**phpMyAdmin:** `http://localhost/phpmyadmin`

Full setup instructions included in main specification.

---

## 📦 Database Schema Changes

### Schema Import (MySQL)
Use `database.sql` (repo root) to create tables via phpMyAdmin.

### MySQL Field Types (reference):
- `BIGINT` for large integers (e.g., sequenceNumber)
- `TEXT` for large text fields
- `DATETIME` for timestamps
- `DECIMAL(3, 2)` for GPA/CGPA

### Enrollment Requests
Stored in `EnrollmentRequest` with a composite unique key on `(studentId, institutionId, status)`.

### Modified Models:
**Student:**
- Added: `enrollmentRequests    EnrollmentRequest[]`
- Removed: `nidHash`, `birthCertHash` (no more hash fields)
- Kept: `nidEncrypted`, `birthCertEncrypted`

**Institution:**
- Added: `enrollmentRequests    EnrollmentRequest[]`

---

## 🔑 Key Implementation Points

### 1. Search Students (NO HASH MATCHING)
```javascript
// Search by email (primary method)
const students = await db.query(
  `SELECT s.*, u.email
   FROM Student s
   JOIN User u ON s.userId = u.id
   WHERE u.status = 'APPROVED' AND LOWER(u.email) LIKE ?`,
  [`%${searchTerm.toLowerCase()}%`]
);

// OR search by name + DOB
const students = await db.query(
  `SELECT s.*, u.email
   FROM Student s
   JOIN User u ON s.userId = u.id
   WHERE u.status = 'APPROVED'
     AND LOWER(s.firstName) LIKE ?
     AND LOWER(s.lastName) LIKE ?
     AND s.dateOfBirth = ?`,
  [`%${firstName.toLowerCase()}%`, `%${lastName.toLowerCase()}%`, dateOfBirth]
);
```

### 2. Encryption Functions (SIMPLIFIED)
```javascript
// utils/encryption.js
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
```

### 3. Student Registration (SIMPLIFIED)
```javascript
// On registration
const encryptedNID = encryptIdentity(nid);
const encryptedBirthCert = encryptIdentity(birthCert);

await db.execute(
  `INSERT INTO Student (id, userId, identityType, nidEncrypted, birthCertEncrypted, ...)
   VALUES (?, ?, ?, ?, ?, ...)`,
  [studentId, userId, primaryIdentityType, encryptedNID, encryptedBirthCert, ...]
);
```

### 4. Display Identity (STUDENT PROFILE ONLY)
```javascript
// In student profile
const [student] = await db.query('SELECT * FROM Student WHERE id = ?', [studentId]);

const displayIdentity = student.identityType === 'NID' 
  ? decryptIdentity(student.nidEncrypted)
  : decryptIdentity(student.birthCertEncrypted);

// Show to student or admin only
```

---

## 🚀 Quick Start Commands

### XAMPP Setup:
```bash
# 1. Download and install XAMPP from https://www.apachefriends.org/
# 2. Start XAMPP Control Panel
# 3. Start Apache and MySQL services
# 4. Open phpMyAdmin: http://localhost/phpmyadmin
# 5. Create database: eduauth_registry (utf8mb4_unicode_ci collation)
```

### Initial Setup:
```bash
# Backend
cd backend
npm init -y
npm install express mysql2 bcryptjs jsonwebtoken nodemailer cors helmet express-rate-limit multer uuid dotenv qrcode pdfkit
npm install --save-dev nodemon prettier eslint
mkdir -p src/{config,middleware,utils,routes,controllers} uploads/{students,institutions,certificates}


# Frontend
cd ../frontend
npm create vite@latest . -- --template react
npm install react-router-dom axios @tanstack/react-query react-hook-form zod @hookform/resolvers lucide-react date-fns
npx tailwindcss init -p
npx shadcn-ui@latest init
```

### Environment Setup:
```bash
# Create backend/.env
DATABASE_URL="mysql://root:@localhost:3306/eduauth_registry"
JWT_SECRET="generate-using-command-below"
ENCRYPTION_KEY="generate-using-command-below"
ENCRYPTION_IV="generate-using-command-below"
# ... other variables
```

### Generate Keys:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_IV=' + require('crypto').randomBytes(16).toString('hex'))"
```

### Database Setup:
```bash
cd backend

# Import database.sql in phpMyAdmin (eduauth_registry)

# Seed admin account
npm run seed
```

### Run Development:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - phpMyAdmin (optional)
# Open http://localhost/phpmyadmin
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation
- [ ] Create project structure (backend + frontend folders)
- [ ] Install all dependencies
- [ ] Review `database.sql` schema
- [ ] Set up .env files with generated keys
- [ ] Create encryption utility functions (NO hash function)
- [ ] Set up JWT middleware
- [ ] Configure email service

### Phase 2: Database
- [ ] Import `database.sql` in phpMyAdmin
- [ ] Run `npm run seed`
- [ ] Create seed script with admin account
- [ ] Verify tables in phpMyAdmin

### Phase 3: Backend API
- [ ] Authentication routes (register, login, verify, reset)
- [ ] Student routes (profile, certificates, enrollment requests)
- [ ] Institution routes (search students, enroll, approve requests)
- [ ] Admin routes (approvals, management)
- [ ] Verification routes (public certificate verification)
- [ ] File upload middleware
- [ ] Rate limiting

### Phase 4: Frontend
- [ ] Set up routing with React Router
- [ ] Configure Tailwind with color scheme
- [ ] Install and configure shadcn/ui components
- [ ] Build common components (Header, Footer, Toast)
- [ ] Landing page with hero section
- [ ] Authentication pages (login, register, reset)
- [ ] Student portal (dashboard, profile, certificates, enrollment requests)
- [ ] Institution portal (dashboard, enroll, approve requests, issue certificates)
- [ ] Admin portal (all approval workflows)
- [ ] Verification page (manual entry + QR scan)

### Phase 5: Advanced Features
- [ ] Certificate serial generation (7-character system)
- [ ] PDF certificate generation with QRCode
- [ ] Email templates (10 different types)
- [ ] Activity logging
- [ ] Profile change requests
- [ ] Program approval system
- [ ] Issue reporting system

### Phase 6: Polish
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Error handling throughout
- [ ] Loading states and skeleton loaders
- [ ] Toast notifications
- [ ] Form validations
- [ ] Accessibility check (keyboard navigation, screen readers)
- [ ] Security audit (no identity leaks, proper encryption)

### Phase 7: Testing & Documentation
- [ ] Test all user flows (student, institution, admin)
- [ ] Test certificate verification
- [ ] Test enrollment (both methods)
- [ ] Test email system
- [ ] Test file uploads
- [ ] Write README with setup instructions
- [ ] Document API endpoints
- [ ] Create user manual

---

## ⚠️ Common Pitfalls to Avoid

1. **DON'T** implement hash-based identity matching - use email search instead
2. **DON'T** expose encrypted identity in API responses
3. **DON'T** skip input validation on backend
4. **DON'T** forget to delete old files when uploading new ones
5. **DON'T** hardcode encryption keys - use .env
6. **DON'T** skip rate limiting on public endpoints
7. **DON'T** forget unique constraints in database
8. **DON'T** skip email verification in registration flow
9. **DON'T** forget to start XAMPP before running the app
10. **DON'T** use PostgreSQL syntax - this is MySQL!

---

## 🔧 MySQL/XAMPP Specific Issues

### Issue: "Can't connect to MySQL server"
```bash
# Solution:
1. Open XAMPP Control Panel
2. Make sure MySQL is started (should show green "Running")
3. If not, click "Start" button
4. Check logs if it won't start: xampp/mysql/data/mysql_error.log
```

### Issue: "Port 3306 already in use"
```bash
# Solution:
1. Another MySQL instance might be running
2. Check: netstat -ano | findstr :3306 (Windows)
3. Or: lsof -i :3306 (macOS/Linux)
4. Stop other MySQL services or change XAMPP port
5. To change port: XAMPP → MySQL Config → my.ini → port=3307
6. Update DATABASE_URL in .env accordingly
```

### Issue: "Access denied for user 'root'@'localhost'"
```bash
# Solution:
1. Check if you set a password in phpMyAdmin
2. If no password: DATABASE_URL="mysql://root:@localhost:3306/eduauth_registry"
3. If password set: DATABASE_URL="mysql://root:your_password@localhost:3306/eduauth_registry"
4. Reset password in phpMyAdmin if needed:
   - User accounts → root → Change password
```

### Issue: "Table doesn't exist after migration"
```bash
# Solution:
1. Check if migration ran successfully
2. Verify in phpMyAdmin: http://localhost/phpmyadmin
3. Select eduauth_registry database
4. Check if tables exist
5. If not, re-import `database.sql` (WARNING: deletes data)
6. Or drop/recreate the database in phpMyAdmin
```

### Issue: "Database schema mismatch"
```bash
# Solution:
1. Ensure `database.sql` matches the running database
2. Re-import `database.sql` if tables are missing
3. Check DATABASE_URL format is correct
4. Restart your backend server
```

### Issue: "Error: P1001 - Can't reach database"
```bash
# Solution:
1. XAMPP MySQL must be running
2. Check XAMPP Control Panel - MySQL should show "Running"
3. Test connection: mysql -u root -p (enter password or press Enter for blank)
4. Verify database exists: SHOW DATABASES;
5. Check DATABASE_URL in .env has correct port (3306)
```

---

## 🎨 UI Component Examples

### Button (Primary)
```jsx
<button className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-medium transition-colors">
  Submit
</button>
```

### Card (Statistics)
```jsx
<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
  <h3 className="text-gray-600 text-sm font-medium">Total Students</h3>
  <p className="text-3xl font-bold text-primary mt-2">1,234</p>
</div>
```

### Badge (Verified)
```jsx
<span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
  <CheckCircle className="w-4 h-4" />
  Verified
</span>
```

---

## 📞 Support & Resources

**Main Specification Document:** `EDUAUTH_SYSTEM_SPECIFICATION.md`
- Complete technical details
- All API endpoints
- Full database schema
- Security requirements
- UI/UX guidelines

**This Quick Reference:** For rapid lookup of key changes and decisions

**When Stuck:**
1. Check the main specification document first
2. Review this quick reference for simplified approach
3. Use phpMyAdmin to inspect database
4. Check console/network tab for errors
5. Verify .env configuration

---

## ✨ Final Notes

**Remember:**
- Email-based search is SIMPLER and MORE RELIABLE than hash matching
- Two enrollment methods give flexibility (institution or student initiated)
- localhost setup for development, easy deployment later
- Professional UI with shadcn/ui components
- Deep blue + emerald green color scheme for trust and verification

**Build with confidence! The specification is comprehensive and battle-tested!** 🚀

---

**Document Version:** 1.0
**Last Updated:** January 2, 2026
**For:** Codex AI Code Generator
