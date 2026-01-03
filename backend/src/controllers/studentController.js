const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { decryptIdentity } = require('../utils/encryption');
const { isStrongPassword } = require('../utils/validators');
const { sendEmail } = require('../utils/emailService');
const {
  profileRequestReceivedEmail,
  issueTicketConfirmationEmail,
} = require('../utils/emailTemplates');
const { toPublicUploadPath, toAbsoluteUploadPath, safeUnlink } = require('../utils/fileUtils');
const { validateFileType } = require('../utils/fileValidation');
const { logActivity } = require('../utils/activityLogger');

async function getStudentByUserId(userId) {
  return prisma.student.findUnique({
    where: { userId },
    include: { user: true },
  });
}

async function dashboard(req, res) {
  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const [enrollmentCount, certificateCount, pendingRequests] = await Promise.all([
    prisma.enrollment.count({ where: { studentId: student.id } }),
    prisma.certificate.count({ where: { studentId: student.id } }),
    prisma.enrollmentRequest.count({ where: { studentId: student.id, status: 'PENDING' } }),
  ]);

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    include: { institution: true },
    orderBy: { enrollmentDate: 'desc' },
  });

  const enrollmentRequests = await prisma.enrollmentRequest.findMany({
    where: { studentId: student.id },
    include: { institution: true },
    orderBy: { createdAt: 'desc' },
  });

  const certificates = await prisma.certificate.findMany({
    where: { studentId: student.id },
    include: { institution: true },
    orderBy: { issueDate: 'desc' },
  });

  return res.json({
    stats: {
      enrollments: enrollmentCount,
      certificates: certificateCount,
      pendingRequests,
    },
    enrollments,
    enrollmentRequests,
    certificates,
  });
}

async function profile(req, res) {
  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const identityNumber = student.identityType === 'NID'
    ? decryptIdentity(student.nidEncrypted)
    : decryptIdentity(student.birthCertEncrypted);

  return res.json({
    id: student.id,
    email: student.user.email,
    firstName: student.firstName,
    middleName: student.middleName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth,
    fatherName: student.fatherName,
    motherName: student.motherName,
    identityType: student.identityType,
    identityNumber,
    phone: student.phone,
    presentAddress: student.presentAddress,
    studentId: student.studentId,
    studentPhoto: student.studentPhoto,
    nidOrBirthCertImage: student.nidOrBirthCertImage,
    createdAt: student.createdAt,
  });
}

async function updatePhoto(req, res) {
  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const photoFile = req.file;
  if (!photoFile) {
    return res.status(400).json({ message: 'Photo file is required.' });
  }

  if (photoFile.size > 512000) {
    return res.status(400).json({ message: 'Photo must be under 500KB.' });
  }
  if (!validateFileType(photoFile.path, ['image/jpeg', 'image/png'])) {
    safeUnlink(photoFile.path);
    return res.status(400).json({ message: 'Invalid photo file type.' });
  }

  const newPhotoPath = toPublicUploadPath(photoFile.path);
  const oldPath = toAbsoluteUploadPath(student.studentPhoto);
  safeUnlink(oldPath);

  await prisma.student.update({
    where: { id: student.id },
    data: { studentPhoto: newPhotoPath },
  });

  return res.json({ message: 'Photo updated successfully.', studentPhoto: newPhotoPath });
}

async function updatePhone(req, res) {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  await prisma.student.update({
    where: { id: student.id },
    data: { phone },
  });

  return res.json({ message: 'Phone updated successfully.' });
}

async function requestProfileUpdate(req, res) {
  const { changes, reason } = req.body;
  if (!changes || !reason) {
    return res.status(400).json({ message: 'Changes and reason are required.' });
  }

  let parsedChanges = changes;
  if (typeof changes === 'string') {
    try {
      parsedChanges = JSON.parse(changes);
    } catch (error) {
      return res.status(400).json({ message: 'Changes must be valid JSON.' });
    }
  }

  if (!parsedChanges || Object.keys(parsedChanges).length === 0) {
    return res.status(400).json({ message: 'Provide at least one change.' });
  }

  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const docs = [];
  for (const file of req.files || []) {
    if (!validateFileType(file.path, ['image/jpeg', 'image/png', 'application/pdf'])) {
      safeUnlink(file.path);
      return res.status(400).json({ message: 'Invalid supporting document type.' });
    }
    docs.push(toPublicUploadPath(file.path));
  }

  const request = await prisma.profileChangeRequest.create({
    data: {
      studentId: student.id,
      changes: JSON.stringify(parsedChanges),
      supportingDocs: docs.length ? JSON.stringify(docs) : null,
      reason,
    },
  });

  await sendEmail({
    to: student.user.email,
    subject: 'Profile Update Request Received',
    html: profileRequestReceivedEmail({ name: student.firstName }),
  });

  await logActivity({
    actorId: student.userId,
    actorType: 'STUDENT',
    actorName: `${student.firstName} ${student.lastName}`,
    action: 'PROFILE_CHANGE_REQUESTED',
    targetType: 'PROFILE_CHANGE_REQUEST',
    targetId: request.id,
    ipAddress: req.ip,
  });

  return res.status(201).json({ message: 'Profile update request submitted.' });
}

async function getProfileRequests(req, res) {
  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const requests = await prisma.profileChangeRequest.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ requests });
}

async function getCertificates(req, res) {
  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const certificates = await prisma.certificate.findMany({
    where: { studentId: student.id },
    include: { institution: true },
    orderBy: { issueDate: 'desc' },
  });

  return res.json({ certificates });
}

async function toggleCertificateSharing(req, res) {
  const { id } = req.params;
  const { isPubliclyShareable } = req.body;

  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const certificate = await prisma.certificate.findFirst({
    where: { id, studentId: student.id },
  });

  if (!certificate) {
    return res.status(404).json({ message: 'Certificate not found.' });
  }

  const updated = await prisma.certificate.update({
    where: { id: certificate.id },
    data: { isPubliclyShareable: Boolean(isPubliclyShareable) },
  });

  return res.json({ message: 'Sharing preference updated.', certificate: updated });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required.' });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ message: 'New password does not meet complexity requirements.' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    return res.status(401).json({ message: 'Current password is incorrect.' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return res.json({ message: 'Password updated successfully.' });
}

async function reportIssue(req, res) {
  const { issueType, description } = req.body;
  if (!issueType || !description) {
    return res.status(400).json({ message: 'Issue type and description are required.' });
  }

  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const ticketNumber = `TKT-${dateStamp}-${suffix}`;
  const attachments = [];
  for (const file of req.files || []) {
    if (!validateFileType(file.path, ['image/jpeg', 'image/png', 'application/pdf'])) {
      safeUnlink(file.path);
      return res.status(400).json({ message: 'Invalid attachment type.' });
    }
    attachments.push(toPublicUploadPath(file.path));
  }

  const report = await prisma.issueReport.create({
    data: {
      ticketNumber,
      studentId: student.id,
      reporterEmail: student.user.email,
      reporterName: `${student.firstName} ${student.lastName}`,
      issueType,
      description,
      attachments: attachments.length ? JSON.stringify(attachments) : null,
    },
  });

  await sendEmail({
    to: student.user.email,
    subject: `Support Ticket Created - ${ticketNumber}`,
    html: issueTicketConfirmationEmail({ ticketNumber, summary: issueType }),
  });

  await logActivity({
    actorId: student.userId,
    actorType: 'STUDENT',
    actorName: `${student.firstName} ${student.lastName}`,
    action: 'ISSUE_REPORTED',
    targetType: 'ISSUE_REPORT',
    targetId: report.id,
    ipAddress: req.ip,
  });

  return res.status(201).json({ message: 'Issue reported successfully.', ticketNumber });
}

async function searchInstitutions(req, res) {
  const term = (req.query.term || '').trim();
  if (!term) {
    return res.status(400).json({ message: 'Search term is required.' });
  }

  const institutions = await prisma.institution.findMany({
    where: {
      user: { status: 'APPROVED' },
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { eiin: { contains: term, mode: 'insensitive' } },
        { registrationNumber: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      type: true,
      phone: true,
      address: true,
      eiin: true,
      registrationNumber: true,
      board: true,
      authorityName: true,
      authorityTitle: true,
      authoritySignature: true,
      user: {
        select: {
          email: true,
          status: true,
        },
      },
    },
    take: 20,
  });

  return res.json({ institutions });
}

async function createEnrollmentRequest(req, res) {
  const {
    institutionId,
    studentInstitutionId,
    enrollmentDate,
    department,
    class: className,
    courseName,
  } = req.body;

  if (!institutionId || !studentInstitutionId || !enrollmentDate) {
    return res.status(400).json({ message: 'Institution, student ID, and enrollment date are required.' });
  }

  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const existing = await prisma.enrollmentRequest.findFirst({
    where: { studentId: student.id, institutionId, status: 'PENDING' },
  });
  if (existing) {
    return res.status(409).json({ message: 'A pending request already exists for this institution.' });
  }

  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    include: { user: true },
  });
  if (!institution || institution.user.status !== 'APPROVED') {
    return res.status(404).json({ message: 'Institution not found or not approved.' });
  }

  const docs = [];
  for (const file of req.files || []) {
    if (!validateFileType(file.path, ['image/jpeg', 'image/png', 'application/pdf'])) {
      safeUnlink(file.path);
      return res.status(400).json({ message: 'Invalid supporting document type.' });
    }
    docs.push(toPublicUploadPath(file.path));
  }

  const request = await prisma.enrollmentRequest.create({
    data: {
      studentId: student.id,
      institutionId,
      studentInstitutionId,
      enrollmentDate: new Date(enrollmentDate),
      department: department || null,
      class: className || null,
      courseName: courseName || null,
      supportingDocs: docs.length ? JSON.stringify(docs) : null,
    },
  });

  await logActivity({
    actorId: student.userId,
    actorType: 'STUDENT',
    actorName: `${student.firstName} ${student.lastName}`,
    action: 'ENROLLMENT_REQUESTED',
    targetType: 'ENROLLMENT_REQUEST',
    targetId: request.id,
    institutionId,
    ipAddress: req.ip,
  });

  return res.status(201).json({ message: 'Enrollment request submitted.' });
}

async function listEnrollmentRequests(req, res) {
  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const requests = await prisma.enrollmentRequest.findMany({
    where: { studentId: student.id },
    include: { institution: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ requests });
}

async function cancelEnrollmentRequest(req, res) {
  const { id } = req.params;
  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const request = await prisma.enrollmentRequest.findFirst({
    where: { id, studentId: student.id },
  });

  if (!request) {
    return res.status(404).json({ message: 'Request not found.' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ message: 'Only pending requests can be cancelled.' });
  }

  await prisma.enrollmentRequest.delete({ where: { id: request.id } });

  return res.json({ message: 'Enrollment request cancelled.' });
}

module.exports = {
  dashboard,
  profile,
  updatePhoto,
  updatePhone,
  requestProfileUpdate,
  getProfileRequests,
  getCertificates,
  toggleCertificateSharing,
  changePassword,
  reportIssue,
  searchInstitutions,
  createEnrollmentRequest,
  listEnrollmentRequests,
  cancelEnrollmentRequest,
};
