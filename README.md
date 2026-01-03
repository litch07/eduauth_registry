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
- Backend: Node.js, Express, Prisma (MySQL)
- Frontend: React 18, Vite, Tailwind CSS
- Security: JWT, Bcrypt, AES-256
- Email: Nodemailer
- PDF/QR: PDFKit, QRCode

## Prerequisites
- Node.js 18+
- XAMPP with MySQL running (port 3306)
- Database created: `eduauth_registry` (utf8mb4_unicode_ci)

## Setup

### 1) Backend
```bash
cd backend
npm install

# Copy env template and fill values
copy .env.example .env

# Prisma
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Start API
npm run dev
```

Backend runs at `http://localhost:5000`.

### 2) Frontend
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
- `JWT_SECRET`
- `ENCRYPTION_KEY` (64 hex chars)
- `ENCRYPTION_IV` (32 hex chars)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`
- `FRONTEND_URL`, `BACKEND_URL`, `PORT`

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
