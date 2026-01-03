const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { encryptIdentity } = require('../utils/encryption');
const { isValidEmail, isStrongPassword, isValidNid, isValidBirthCert } = require('../utils/validators');
const { generateToken } = require('../utils/tokens');
const { sendEmail } = require('../utils/emailService');
const {
  verificationEmail,
  passwordResetEmail,
} = require('../utils/emailTemplates');
const { toPublicUploadPath, safeUnlink } = require('../utils/fileUtils');
const { validateFileType } = require('../utils/fileValidation');
const { logActivity } = require('../utils/activityLogger');

const authorityTitles = {
  HIGH_SCHOOL: 'Head Teacher',
  COLLEGE: 'Principal',
  TECHNICAL: 'Principal',
  MADRASAH: 'Principal',
  UNIVERSITY: 'Vice Chancellor',
  TRAINING_CENTRE: 'Director',
};

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function getAuthorityTitle(type) {
  return authorityTitles[type] || 'Authorized Officer';
}

async function registerStudent(req, res) {
  const {
    firstName,
    middleName,
    lastName,
    dateOfBirth,
    nid,
    birthCert,
    identityType,
    fatherName,
    motherName,
    email,
    phone,
    presentAddress,
    password,
    confirmPassword,
  } = req.body;

  if (!firstName || !lastName || !dateOfBirth || !fatherName || !motherName || !phone || !presentAddress) {
    return res.status(400).json({ message: 'Missing required student fields.' });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required.' });
  }
  if (!password || !isStrongPassword(password)) {
    return res.status(400).json({ message: 'Password does not meet complexity requirements.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  const hasNid = Boolean(nid);
  const hasBirthCert = Boolean(birthCert);
  if (!hasNid && !hasBirthCert) {
    return res.status(400).json({ message: 'Provide NID or Birth Certificate.' });
  }

  if (hasNid && !isValidNid(nid)) {
    return res.status(400).json({ message: 'NID must be 10 or 13 digits.' });
  }
  if (hasBirthCert && !isValidBirthCert(birthCert)) {
    return res.status(400).json({ message: 'Birth certificate must be 17 digits.' });
  }

  const resolvedIdentityType = identityType || (hasNid ? 'NID' : 'BIRTH_CERTIFICATE');
  if (!['NID', 'BIRTH_CERTIFICATE'].includes(resolvedIdentityType)) {
    return res.status(400).json({ message: 'Invalid identity type.' });
  }
  if (resolvedIdentityType === 'NID' && !hasNid) {
    return res.status(400).json({ message: 'NID is required for selected identity type.' });
  }
  if (resolvedIdentityType === 'BIRTH_CERTIFICATE' && !hasBirthCert) {
    return res.status(400).json({ message: 'Birth certificate is required for selected identity type.' });
  }

  const nidFile = req.files && req.files.nidOrBirthCertImage ? req.files.nidOrBirthCertImage[0] : null;
  const photoFile = req.files && req.files.studentPhoto ? req.files.studentPhoto[0] : null;

  if (!nidFile || !photoFile) {
    return res.status(400).json({ message: 'Identity document and photo are required.' });
  }
  if (photoFile.size > 512000) {
    return res.status(400).json({ message: 'Student photo must be under 500KB.' });
  }
  if (!validateFileType(nidFile.path, ['image/jpeg', 'image/png'])) {
    safeUnlink(nidFile.path);
    safeUnlink(photoFile.path);
    return res.status(400).json({ message: 'Invalid identity document file type.' });
  }
  if (!validateFileType(photoFile.path, ['image/jpeg', 'image/png'])) {
    safeUnlink(nidFile.path);
    safeUnlink(photoFile.path);
    return res.status(400).json({ message: 'Invalid photo file type.' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  const parsedDob = new Date(dateOfBirth);
  if (Number.isNaN(parsedDob.getTime())) {
    return res.status(400).json({ message: 'Invalid date of birth.' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const emailVerifyToken = generateToken(32);
  const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const encryptedNid = hasNid ? encryptIdentity(nid) : null;
  const encryptedBirth = hasBirthCert ? encryptIdentity(birthCert) : null;

  const studentPhotoPath = toPublicUploadPath(photoFile.path);
  const identityDocPath = toPublicUploadPath(nidFile.path);

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'STUDENT',
        status: 'PENDING_VERIFICATION',
        emailVerifyToken,
        emailVerifyExpiry,
      },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        firstName,
        middleName: middleName || null,
        lastName,
        dateOfBirth: parsedDob,
        fatherName,
        motherName,
        identityType: resolvedIdentityType,
        nidEncrypted: encryptedNid,
        birthCertEncrypted: encryptedBirth,
        phone,
        presentAddress,
        nidOrBirthCertImage: identityDocPath,
        studentPhoto: studentPhotoPath,
      },
    });

    return { user, student };
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}`;
  await sendEmail({
    to: email,
    subject: 'Verify Your Email - EduAuth Registry',
    html: verificationEmail({ name: firstName, verifyUrl }),
  });

  await logActivity({
    actorId: created.user.id,
    actorType: 'STUDENT',
    actorName: `${firstName} ${lastName}`,
    action: 'REGISTRATION_SUBMITTED',
    targetType: 'STUDENT',
    targetId: created.student.id,
    ipAddress: req.ip,
  });

  return res.status(201).json({ message: 'Registration successful. Verify your email.' });
}

async function registerInstitution(req, res) {
  const {
    name,
    email,
    phone,
    address,
    type,
    eiin,
    registrationNumber,
    board,
    authorityName,
    password,
    confirmPassword,
  } = req.body;

  if (!name || !email || !phone || !address || !type || !authorityName) {
    return res.status(400).json({ message: 'Missing required institution fields.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required.' });
  }
  if (!password || !isStrongPassword(password)) {
    return res.status(400).json({ message: 'Password does not meet complexity requirements.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  if (['HIGH_SCHOOL', 'COLLEGE', 'MADRASAH'].includes(type) && !eiin) {
    return res.status(400).json({ message: 'EIIN is required for this institution type.' });
  }

  if (['UNIVERSITY', 'TRAINING_CENTRE'].includes(type) && !registrationNumber) {
    return res.status(400).json({ message: 'Registration number is required for this institution type.' });
  }

  if (type === 'MADRASAH' && board !== 'MADRASAH') {
    return res.status(400).json({ message: 'Madrasah institutions must use Madrasah board.' });
  }
  if (type === 'TECHNICAL' && board !== 'TECHNICAL') {
    return res.status(400).json({ message: 'Technical institutions must use Technical board.' });
  }
  if (['UNIVERSITY', 'TRAINING_CENTRE'].includes(type) && board) {
    return res.status(400).json({ message: 'Board must be empty for university or training centre.' });
  }
  if (!['UNIVERSITY', 'TRAINING_CENTRE', 'MADRASAH', 'TECHNICAL'].includes(type) && !board) {
    return res.status(400).json({ message: 'Board is required for this institution type.' });
  }
  if (!['UNIVERSITY', 'TRAINING_CENTRE', 'MADRASAH', 'TECHNICAL'].includes(type) && ['MADRASAH', 'TECHNICAL'].includes(board)) {
    return res.status(400).json({ message: 'Invalid board for selected institution type.' });
  }

  const signatureFile = req.files && req.files.authoritySignature ? req.files.authoritySignature[0] : null;
  if (!signatureFile) {
    return res.status(400).json({ message: 'Authority signature is required.' });
  }
  if (!validateFileType(signatureFile.path, ['image/jpeg', 'image/png'])) {
    safeUnlink(signatureFile.path);
    return res.status(400).json({ message: 'Invalid signature file type.' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const emailVerifyToken = generateToken(32);
  const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const authoritySignaturePath = toPublicUploadPath(signatureFile.path);
  const authorityTitle = getAuthorityTitle(type);

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'INSTITUTION',
        status: 'PENDING_VERIFICATION',
        emailVerifyToken,
        emailVerifyExpiry,
      },
    });

    const institution = await tx.institution.create({
      data: {
        userId: user.id,
        name,
        type,
        phone,
        address,
        eiin: eiin || null,
        registrationNumber: registrationNumber || null,
        board: board || null,
        authorityName,
        authorityTitle,
        authoritySignature: authoritySignaturePath,
      },
    });

    return { user, institution };
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}`;
  await sendEmail({
    to: email,
    subject: 'Verify Your Email - EduAuth Registry',
    html: verificationEmail({ name, verifyUrl }),
  });

  await logActivity({
    actorId: created.user.id,
    actorType: 'INSTITUTION',
    actorName: name,
    action: 'REGISTRATION_SUBMITTED',
    targetType: 'INSTITUTION',
    targetId: created.institution.id,
    ipAddress: req.ip,
  });

  return res.status(201).json({ message: 'Registration successful. Verify your email.' });
}

async function verifyEmail(req, res) {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: 'Token is required.' });
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      status: 'PENDING_APPROVAL',
      emailVerifyToken: null,
      emailVerifyExpiry: null,
    },
  });

  await logActivity({
    actorId: user.id,
    actorType: user.role,
    actorName: user.email,
    action: 'EMAIL_VERIFIED',
    targetType: user.role,
    targetId: user.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Email verified successfully. Await admin approval.' });
}

async function resendVerification(req, res) {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required.' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      student: true,
      institution: true,
    },
  });

  if (!user || user.emailVerified || user.status !== 'PENDING_VERIFICATION') {
    return res.json({ message: 'If the email exists, a verification link has been sent.' });
  }

  const emailVerifyToken = generateToken(32);
  const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifyToken,
      emailVerifyExpiry,
    },
  });

  const name = user.student?.firstName || user.institution?.name || user.email;
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}`;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - EduAuth Registry',
    html: verificationEmail({ name, verifyUrl }),
  });

  return res.json({ message: 'Verification email sent.' });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ message: 'Email not verified.' });
  }

  if (user.status !== 'APPROVED') {
    return res.status(403).json({ message: `Account status: ${user.status}` });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json({ message: 'If the email exists, a reset link has been sent.' });
  }

  const resetToken = generateToken(32);
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: email,
    subject: 'Reset Your Password - EduAuth Registry',
    html: passwordResetEmail({ name: email, resetUrl }),
  });

  return res.json({ message: 'If the email exists, a reset link has been sent.' });
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: 'Password does not meet complexity requirements.' });
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return res.json({ message: 'Password reset successfully.' });
}

module.exports = {
  registerStudent,
  registerInstitution,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
};
