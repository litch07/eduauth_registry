# EduAuth Registry

Bangladesh's centralized digital trust platform for academic credentials. EduAuth Registry replaces paper-based verification with instant, tamper-proof digital certificates backed by cryptographic hashing and QR verification.

## Features
- Student, Institution, and Admin portals
- Email verification + admin approval workflow
- Encrypted identity storage (AES-256)
- Certificate serial generation with check digit
- PDF certificates + QR codes
- Public certificate verification
- Activity logs, program approvals, and issue reporting

## Tech Stack
- Backend: Node.js, Express, mysql2 (MySQL)
- Frontend: React 18, Vite, Tailwind CSS
- Security: JWT, Bcrypt, AES-256
- Email: Nodemailer
- PDF/QR: PDFKit, QRCode

## Prerequisites
- Node.js 18+
- XAMPP with MySQL running (port 3306)
- Database created: `eduauth_registry` (utf8mb4_unicode_ci)

## Setup

### 1) Database (phpMyAdmin)
1. Start Apache + MySQL in XAMPP.
2. Open phpMyAdmin: `http://localhost/phpmyadmin`.
3. Create database `eduauth_registry` with collation `utf8mb4_unicode_ci`.
4. Import `database.sql` (root of this repo) into the database.

### 2) Backend
```bash
cd backend
npm install

# Copy env template and fill values
copy .env.example .env

# Seed admin account
npm run seed

# Start API
npm run dev
```

Backend runs at `http://localhost:5000`.

### 3) Frontend
```bash
cd frontend
npm install

# Copy env template
copy .env.example .env

# Start UI
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Environment Variables

### Backend (`backend/.env`)
- `DATABASE_URL` (MySQL connection string)
- Optional: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (used if `DATABASE_URL` is not set)
- `JWT_SECRET`
- `ENCRYPTION_KEY` (64 hex chars)
- `ENCRYPTION_IV` (32 hex chars)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`
- `FRONTEND_URL`, `BACKEND_URL`, `PORT`

Example:
```
DATABASE_URL="mysql://root:@localhost:3306/eduauth_registry"
```

### Frontend (`frontend/.env`)
- `VITE_API_URL`
- `VITE_BACKEND_URL`

## Admin Access
Seeded admin account:
- Email: `eduauthregistry@gmail.com`
- Password: `admin`

## Notes
- MySQL via XAMPP is required (PostgreSQL is not supported in this build).
- Identity numbers are encrypted and never returned to institutions.
- Use `/api/verify/certificate` to verify a certificate serial.

## License
MIT
