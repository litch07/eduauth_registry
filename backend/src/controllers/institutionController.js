const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { isStrongPassword } = require('../utils/validators');
const { generateCertificateSerial } = require('../utils/serialGenerator');
const { generateCertificatePdf } = require('../utils/pdfGenerator');
const { sendEmail } = require('../utils/emailService');
const {
  certificateIssuedEmail,
  issueTicketConfirmationEmail,
  enrollmentApprovedEmail,
  enrollmentRejectedEmail,
} = require('../utils/emailTemplates');
const { toPublicUploadPath, toAbsoluteUploadPath, safeUnlink } = require('../utils/fileUtils');
const { validateFileType } = require('../utils/fileValidation');
const { logActivity } = require('../utils/activityLogger');

async function getInstitutionByUserId(userId) {
  return prisma.institution.findUnique({
    where: { userId },
    include: { user: true },
  });
}

async function dashboard(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const [studentCount, certificateCount, pendingRequests, programCount] = await Promise.all([
    prisma.enrollment.count({ where: { institutionId: institution.id } }),
    prisma.certificate.count({ where: { institutionId: institution.id } }),
    prisma.enrollmentRequest.count({ where: { institutionId: institution.id, status: 'PENDING' } }),
    prisma.institutionProgram.count({ where: { institutionId: institution.id, isActive: true } }),
  ]);

  const recentCertificates = await prisma.certificate.findMany({
    where: { institutionId: institution.id },
    orderBy: { issueDate: 'desc' },
    take: 10,
    include: { student: true },
  });

  return res.json({
    stats: {
      enrolledStudents: studentCount,
      certificatesIssued: certificateCount,
      pendingRequests,
      activePrograms: programCount,
    },
    recentCertificates,
  });
}

async function profile(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  return res.json({
    id: institution.id,
    email: institution.user.email,
    name: institution.name,
    type: institution.type,
    phone: institution.phone,
    address: institution.address,
    eiin: institution.eiin,
    registrationNumber: institution.registrationNumber,
    board: institution.board,
    authorityName: institution.authorityName,
    authorityTitle: institution.authorityTitle,
    authoritySignature: institution.authoritySignature,
    canIssueCertificates: institution.canIssueCertificates,
  });
}

async function searchStudents(req, res) {
  const { email, firstName, lastName, dateOfBirth, studentId } = req.query;

  const where = {
    user: { status: 'APPROVED' },
  };

  if (email) {
    where.user = { email: { contains: email, mode: 'insensitive' }, status: 'APPROVED' };
  } else if (studentId) {
    where.studentId = { contains: studentId, mode: 'insensitive' };
  } else if (firstName && lastName && dateOfBirth) {
    where.firstName = { contains: firstName, mode: 'insensitive' };
    where.lastName = { contains: lastName, mode: 'insensitive' };
    where.dateOfBirth = new Date(dateOfBirth);
  } else {
    return res.status(400).json({ message: 'Provide email, student ID, or full name with DOB.' });
  }

  const students = await prisma.student.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      dateOfBirth: true,
      studentId: true,
      studentPhoto: true,
      user: {
        select: {
          email: true,
          status: true,
        },
      },
    },
    take: 20,
  });

  return res.json({ students });
}

async function enrollStudent(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }
  if (!institution.canIssueCertificates) {
    return res.status(403).json({ message: 'Institution cannot issue certificates currently.' });
  }

  const {
    studentId,
    studentInstitutionId,
    enrollmentDate,
    department,
    class: className,
    courseName,
  } = req.body;

  if (!studentId || !studentInstitutionId || !enrollmentDate) {
    return res.status(400).json({ message: 'Student, institution ID, and enrollment date are required.' });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });
  if (!student || student.user.status !== 'APPROVED') {
    return res.status(404).json({ message: 'Student not found or not approved.' });
  }

  const existing = await prisma.enrollment.findFirst({
    where: { studentId: student.id, institutionId: institution.id },
  });
  if (existing) {
    return res.status(409).json({ message: 'Student already enrolled.' });
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: student.id,
      institutionId: institution.id,
      studentInstitutionId,
      enrollmentDate: new Date(enrollmentDate),
      department: department || null,
      class: className || null,
      courseName: courseName || null,
    },
  });

  await sendEmail({
    to: student.user.email,
    subject: 'Enrollment Confirmed - EduAuth Registry',
    html: enrollmentApprovedEmail({
      studentName: `${student.firstName} ${student.lastName}`,
      institutionName: institution.name,
    }),
  });

  await logActivity({
    actorId: institution.userId,
    actorType: 'INSTITUTION',
    actorName: institution.name,
    action: 'ENROLLMENT_CREATED',
    targetType: 'ENROLLMENT',
    targetId: enrollment.id,
    institutionId: institution.id,
    ipAddress: req.ip,
  });

  return res.status(201).json({ message: 'Student enrolled successfully.', enrollment });
}

async function listStudents(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { institutionId: institution.id },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          dateOfBirth: true,
          studentId: true,
          studentPhoto: true,
        },
      },
    },
    orderBy: { enrollmentDate: 'desc' },
  });

  return res.json({ enrollments });
}

async function getStudentDetails(req, res) {
  const { id } = req.params;
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: id, institutionId: institution.id },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          dateOfBirth: true,
          studentId: true,
          studentPhoto: true,
          phone: true,
          presentAddress: true,
        },
      },
    },
  });
  if (!enrollment) {
    return res.status(404).json({ message: 'Student not enrolled.' });
  }

  const certificates = await prisma.certificate.findMany({
    where: { studentId: id, institutionId: institution.id },
    orderBy: { issueDate: 'desc' },
  });

  return res.json({ enrollment, certificates });
}

async function issueCertificate(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }
  if (!institution.canIssueCertificates) {
    return res.status(403).json({ message: 'Institution cannot issue certificates currently.' });
  }

  const { studentId, certificateType, ...details } = req.body;
  if (!studentId || !certificateType) {
    return res.status(400).json({ message: 'Student and certificate type are required.' });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, institutionId: institution.id },
  });
  if (!enrollment) {
    return res.status(400).json({ message: 'Student is not enrolled in this institution.' });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });
  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  const { serial, sequenceNumber } = await generateCertificateSerial(prisma);
  const qrCodeData = `${process.env.FRONTEND_URL}/verify?serial=${serial}`;

  const certificate = await prisma.certificate.create({
    data: {
      serial,
      sequenceNumber,
      certificateType,
      studentId,
      institutionId: institution.id,
      rollNumber: details.rollNumber || null,
      registrationNumber: details.registrationNumber || null,
      examinationYear: details.examinationYear ? Number(details.examinationYear) : null,
      board: details.board || institution.board || null,
      group: details.group || null,
      gpa: details.gpa ? Number(details.gpa) : null,
      passingYear: details.passingYear ? Number(details.passingYear) : null,
      diplomaSubject: details.diplomaSubject || null,
      duration: details.duration || null,
      session: details.session || null,
      program: details.program || null,
      department: details.department || null,
      major: details.major || null,
      cgpa: details.cgpa ? Number(details.cgpa) : null,
      degreeClass: details.degreeClass || null,
      convocationDate: details.convocationDate ? new Date(details.convocationDate) : null,
      completionDate: details.completionDate ? new Date(details.completionDate) : null,
      skillName: details.skillName || null,
      authorityName: institution.authorityName,
      authorityTitle: institution.authorityTitle,
      authoritySignature: institution.authoritySignature,
      qrCodeData,
    },
  });

  const signatureAbsolute = toAbsoluteUploadPath(institution.authoritySignature);
  const pdfPath = await generateCertificatePdf({
    certificate: { ...certificate, studentInstitutionId: enrollment.studentInstitutionId },
    student,
    institution: { ...institution, authoritySignature: signatureAbsolute },
  });

  const publicPdfPath = toPublicUploadPath(pdfPath);

  const updatedCertificate = await prisma.certificate.update({
    where: { id: certificate.id },
    data: { pdfPath: publicPdfPath },
  });

  await sendEmail({
    to: student.user.email,
    subject: `New Certificate Issued - ${certificateType}`,
    html: certificateIssuedEmail({
      name: student.firstName,
      certificateType,
      serial,
      viewUrl: `${process.env.FRONTEND_URL}/student/certificates`,
    }),
  });

  await logActivity({
    actorId: institution.userId,
    actorType: 'INSTITUTION',
    actorName: institution.name,
    action: 'CERTIFICATE_ISSUED',
    targetType: 'CERTIFICATE',
    targetId: certificate.id,
    institutionId: institution.id,
    ipAddress: req.ip,
    details: { serial },
  });

  return res.status(201).json({ message: 'Certificate issued successfully.', certificate: updatedCertificate });
}

async function getCertificates(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const certificates = await prisma.certificate.findMany({
    where: { institutionId: institution.id },
    include: { student: true },
    orderBy: { issueDate: 'desc' },
  });

  return res.json({ certificates });
}

async function requestProgram(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const { programName, programType, description } = req.body;
  if (!programName || !programType || !description) {
    return res.status(400).json({ message: 'Program name, type, and description are required.' });
  }

  const docs = [];
  for (const file of req.files || []) {
    if (!validateFileType(file.path, ['image/jpeg', 'image/png', 'application/pdf'])) {
      safeUnlink(file.path);
      return res.status(400).json({ message: 'Invalid supporting document type.' });
    }
    docs.push(toPublicUploadPath(file.path));
  }

  const request = await prisma.programRequest.create({
    data: {
      institutionId: institution.id,
      programName,
      programType,
      description,
      supportingDocs: docs.length ? JSON.stringify(docs) : null,
    },
  });

  await logActivity({
    actorId: institution.userId,
    actorType: 'INSTITUTION',
    actorName: institution.name,
    action: 'PROGRAM_REQUESTED',
    targetType: 'PROGRAM_REQUEST',
    targetId: request.id,
    institutionId: institution.id,
    ipAddress: req.ip,
  });

  return res.status(201).json({ message: 'Program approval requested.' });
}

async function getPrograms(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const programs = await prisma.institutionProgram.findMany({
    where: { institutionId: institution.id, isActive: true },
    orderBy: { approvedAt: 'desc' },
  });

  return res.json({ programs });
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

  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
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
      reporterEmail: institution.user.email,
      reporterName: institution.name,
      issueType,
      description,
      attachments: attachments.length ? JSON.stringify(attachments) : null,
    },
  });

  await sendEmail({
    to: institution.user.email,
    subject: `Support Ticket Created - ${ticketNumber}`,
    html: issueTicketConfirmationEmail({ ticketNumber, summary: issueType }),
  });

  await logActivity({
    actorId: institution.userId,
    actorType: 'INSTITUTION',
    actorName: institution.name,
    action: 'ISSUE_REPORTED',
    targetType: 'ISSUE_REPORT',
    targetId: report.id,
    institutionId: institution.id,
    ipAddress: req.ip,
  });

  return res.status(201).json({ message: 'Issue reported successfully.', ticketNumber });
}

async function listEnrollmentRequests(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const requests = await prisma.enrollmentRequest.findMany({
    where: { institutionId: institution.id, status: 'PENDING' },
    include: { student: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ requests });
}

async function approveEnrollmentRequest(req, res) {
  const { id } = req.params;
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const request = await prisma.enrollmentRequest.findFirst({
    where: { id, institutionId: institution.id },
    include: { student: { include: { user: true } } },
  });

  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ message: 'Request not found or already handled.' });
  }

  const existing = await prisma.enrollment.findFirst({
    where: { studentId: request.studentId, institutionId: institution.id },
  });
  if (existing) {
    return res.status(409).json({ message: 'Student already enrolled.' });
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: request.studentId,
      institutionId: institution.id,
      studentInstitutionId: request.studentInstitutionId,
      enrollmentDate: request.enrollmentDate,
      department: request.department,
      class: request.class,
      courseName: request.courseName,
    },
  });

  await prisma.enrollmentRequest.update({
    where: { id: request.id },
    data: {
      status: 'APPROVED',
      decidedAt: new Date(),
      decidedBy: institution.userId,
    },
  });

  if (request.student && request.student.user) {
    await sendEmail({
      to: request.student.user.email,
      subject: 'Enrollment Confirmed - EduAuth Registry',
      html: enrollmentApprovedEmail({
        studentName: `${request.student.firstName} ${request.student.lastName}`,
        institutionName: institution.name,
      }),
    });
  }

  await logActivity({
    actorId: institution.userId,
    actorType: 'INSTITUTION',
    actorName: institution.name,
    action: 'ENROLLMENT_REQUEST_APPROVED',
    targetType: 'ENROLLMENT_REQUEST',
    targetId: request.id,
    institutionId: institution.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Enrollment request approved.', enrollment });
}

async function rejectEnrollmentRequest(req, res) {
  const { id } = req.params;
  const { comments } = req.body;

  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const request = await prisma.enrollmentRequest.findFirst({
    where: { id, institutionId: institution.id },
    include: { student: { include: { user: true } } },
  });

  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ message: 'Request not found or already handled.' });
  }

  await prisma.enrollmentRequest.update({
    where: { id: request.id },
    data: {
      status: 'REJECTED',
      institutionComments: comments || null,
      decidedAt: new Date(),
      decidedBy: institution.userId,
    },
  });

  if (request.student && request.student.user) {
    await sendEmail({
      to: request.student.user.email,
      subject: 'Enrollment Request Update - EduAuth Registry',
      html: enrollmentRejectedEmail({
        studentName: `${request.student.firstName} ${request.student.lastName}`,
        institutionName: institution.name,
        reason: comments,
      }),
    });
  }

  await logActivity({
    actorId: institution.userId,
    actorType: 'INSTITUTION',
    actorName: institution.name,
    action: 'ENROLLMENT_REQUEST_REJECTED',
    targetType: 'ENROLLMENT_REQUEST',
    targetId: request.id,
    institutionId: institution.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Enrollment request rejected.' });
}

module.exports = {
  dashboard,
  profile,
  searchStudents,
  enrollStudent,
  listStudents,
  getStudentDetails,
  issueCertificate,
  getCertificates,
  requestProgram,
  getPrograms,
  changePassword,
  reportIssue,
  listEnrollmentRequests,
  approveEnrollmentRequest,
  rejectEnrollmentRequest,
};
