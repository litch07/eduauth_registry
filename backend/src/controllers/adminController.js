const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { encryptIdentity, decryptIdentity } = require('../utils/encryption');
const { sendEmail } = require('../utils/emailService');
const {
  registrationApprovedEmail,
  registrationRejectedEmail,
  profileRequestApprovedEmail,
  profileRequestRejectedEmail,
  programDecisionEmail,
  permissionRevokedEmail,
  issueResponseEmail,
} = require('../utils/emailTemplates');
const { logActivity } = require('../utils/activityLogger');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function adminLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const matches = await bcrypt.compare(password, admin.password);
  if (!matches) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = signToken({ id: admin.id, email: admin.email, role: 'ADMIN' });
  return res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
}

async function dashboard(req, res) {
  const [
    pendingStudents,
    pendingInstitutions,
    pendingProfileChanges,
    pendingPrograms,
    totalStudents,
    totalInstitutions,
    totalCertificates,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', status: 'PENDING_APPROVAL' } }),
    prisma.user.count({ where: { role: 'INSTITUTION', status: 'PENDING_APPROVAL' } }),
    prisma.profileChangeRequest.count({ where: { status: 'PENDING' } }),
    prisma.programRequest.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'STUDENT', status: 'APPROVED' } }),
    prisma.user.count({ where: { role: 'INSTITUTION', status: 'APPROVED' } }),
    prisma.certificate.count(),
  ]);

  const recentLogs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return res.json({
    stats: {
      pendingStudents,
      pendingInstitutions,
      pendingProfileChanges,
      pendingPrograms,
      totalStudents,
      totalInstitutions,
      totalCertificates,
    },
    recentLogs,
  });
}

async function pendingStudents(req, res) {
  const users = await prisma.user.findMany({
    where: { role: 'STUDENT', status: 'PENDING_APPROVAL' },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          dateOfBirth: true,
          fatherName: true,
          motherName: true,
          identityType: true,
          nidEncrypted: true,
          birthCertEncrypted: true,
          phone: true,
          presentAddress: true,
          nidOrBirthCertImage: true,
          studentPhoto: true,
          studentId: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const sanitized = users.map((user) => {
    if (!user.student) return user;
    const identityNumber = user.student.identityType === 'NID'
      ? decryptIdentity(user.student.nidEncrypted)
      : decryptIdentity(user.student.birthCertEncrypted);
    const { nidEncrypted, birthCertEncrypted, ...student } = user.student;
    return {
      ...user,
      student: {
        ...student,
        identityNumber,
      },
    };
  });

  return res.json({ users: sanitized });
}

async function approveStudent(req, res) {
  const { id } = req.params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  await prisma.user.update({
    where: { id: student.userId },
    data: { status: 'APPROVED' },
  });

  await prisma.student.update({
    where: { id: student.id },
    data: { rejectionReason: null },
  });

  await sendEmail({
    to: student.user.email,
    subject: 'Your Registration Has Been Approved',
    html: registrationApprovedEmail({ name: student.firstName, loginUrl: `${process.env.FRONTEND_URL}/login` }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'STUDENT_APPROVED',
    targetType: 'STUDENT',
    targetId: student.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Student approved.' });
}

async function rejectStudent(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ message: 'Rejection reason is required.' });
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  await prisma.user.update({
    where: { id: student.userId },
    data: { status: 'REJECTED' },
  });

  await prisma.student.update({
    where: { id: student.id },
    data: { rejectionReason: reason },
  });

  await sendEmail({
    to: student.user.email,
    subject: 'Registration Status Update',
    html: registrationRejectedEmail({
      name: student.firstName,
      reason,
      registerUrl: `${process.env.FRONTEND_URL}/register`,
      submittedData: {
        'Full Name': `${student.firstName} ${student.middleName || ''} ${student.lastName}`.replace(/\s+/g, ' ').trim(),
        'Date of Birth': student.dateOfBirth ? student.dateOfBirth.toLocaleDateString('en-GB') : '',
        'Identity Type': student.identityType,
        Phone: student.phone,
        Address: student.presentAddress,
      },
    }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'STUDENT_REJECTED',
    targetType: 'STUDENT',
    targetId: student.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Student rejected.' });
}

async function pendingInstitutions(req, res) {
  const users = await prisma.user.findMany({
    where: { role: 'INSTITUTION', status: 'PENDING_APPROVAL' },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      institution: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ users });
}

async function approveInstitution(req, res) {
  const { id } = req.params;
  const institution = await prisma.institution.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!institution) {
    return res.status(404).json({ message: 'Institution not found.' });
  }

  await prisma.user.update({
    where: { id: institution.userId },
    data: { status: 'APPROVED' },
  });

  await prisma.institution.update({
    where: { id: institution.id },
    data: { rejectionReason: null },
  });

  await sendEmail({
    to: institution.user.email,
    subject: 'Your Registration Has Been Approved',
    html: registrationApprovedEmail({ name: institution.name, loginUrl: `${process.env.FRONTEND_URL}/login` }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'INSTITUTION_APPROVED',
    targetType: 'INSTITUTION',
    targetId: institution.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Institution approved.' });
}

async function rejectInstitution(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ message: 'Rejection reason is required.' });
  }

  const institution = await prisma.institution.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!institution) {
    return res.status(404).json({ message: 'Institution not found.' });
  }

  await prisma.user.update({
    where: { id: institution.userId },
    data: { status: 'REJECTED' },
  });

  await prisma.institution.update({
    where: { id: institution.id },
    data: { rejectionReason: reason },
  });

  await sendEmail({
    to: institution.user.email,
    subject: 'Registration Status Update',
    html: registrationRejectedEmail({
      name: institution.name,
      reason,
      registerUrl: `${process.env.FRONTEND_URL}/register`,
      submittedData: {
        'Institution Name': institution.name,
        Type: institution.type,
        Phone: institution.phone,
        Address: institution.address,
        EIIN: institution.eiin || '',
        'Registration Number': institution.registrationNumber || '',
        Board: institution.board || '',
        'Authority Name': institution.authorityName,
        'Authority Title': institution.authorityTitle,
      },
    }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'INSTITUTION_REJECTED',
    targetType: 'INSTITUTION',
    targetId: institution.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Institution rejected.' });
}

async function pendingProfileChanges(req, res) {
  const requests = await prisma.profileChangeRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      student: {
        include: {
          user: {
            select: {
              email: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ requests });
}

async function approveProfileChange(req, res) {
  const { id } = req.params;
  const { adminComments } = req.body;

  const request = await prisma.profileChangeRequest.findUnique({
    where: { id },
    include: { student: { include: { user: true } } },
  });

  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ message: 'Request not found or already handled.' });
  }

  let changes = {};
  try {
    changes = JSON.parse(request.changes);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid change payload.' });
  }

  const updates = {};
  Object.entries(changes).forEach(([key, value]) => {
    const newValue = value && typeof value === 'object' && 'new' in value ? value.new : value;
    if (newValue === undefined) return;
    if (key === 'nid') {
      updates.nidEncrypted = encryptIdentity(newValue);
      updates.identityType = 'NID';
    } else if (key === 'birthCert') {
      updates.birthCertEncrypted = encryptIdentity(newValue);
      updates.identityType = 'BIRTH_CERTIFICATE';
    } else if (key === 'dateOfBirth') {
      updates.dateOfBirth = new Date(newValue);
    } else {
      updates[key] = newValue;
    }
  });

  await prisma.student.update({
    where: { id: request.studentId },
    data: updates,
  });

  await prisma.profileChangeRequest.update({
    where: { id: request.id },
    data: {
      status: 'APPROVED',
      adminComments: adminComments || null,
      decidedAt: new Date(),
      decidedBy: req.user.id,
    },
  });

  await sendEmail({
    to: request.student.user.email,
    subject: 'Profile Update Approved',
    html: profileRequestApprovedEmail({
      name: request.student.firstName,
      summary: Object.keys(updates).join(', '),
    }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'PROFILE_CHANGE_APPROVED',
    targetType: 'PROFILE_CHANGE_REQUEST',
    targetId: request.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Profile change approved.' });
}

async function rejectProfileChange(req, res) {
  const { id } = req.params;
  const { adminComments } = req.body;
  if (!adminComments) {
    return res.status(400).json({ message: 'Admin comments are required.' });
  }

  const request = await prisma.profileChangeRequest.findUnique({
    where: { id },
    include: { student: { include: { user: true } } },
  });

  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ message: 'Request not found or already handled.' });
  }

  await prisma.profileChangeRequest.update({
    where: { id: request.id },
    data: {
      status: 'REJECTED',
      adminComments,
      decidedAt: new Date(),
      decidedBy: req.user.id,
    },
  });

  await sendEmail({
    to: request.student.user.email,
    subject: 'Profile Update Request - Action Required',
    html: profileRequestRejectedEmail({ name: request.student.firstName, reason: adminComments }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'PROFILE_CHANGE_REJECTED',
    targetType: 'PROFILE_CHANGE_REQUEST',
    targetId: request.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Profile change rejected.' });
}

async function pendingPrograms(req, res) {
  const requests = await prisma.programRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      institution: {
        include: {
          user: {
            select: {
              email: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ requests });
}

async function approveProgram(req, res) {
  const { id } = req.params;
  const { adminComments } = req.body;

  const request = await prisma.programRequest.findUnique({
    where: { id },
    include: { institution: { include: { user: true } } },
  });

  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ message: 'Request not found or already handled.' });
  }

  const program = await prisma.institutionProgram.create({
    data: {
      institutionId: request.institutionId,
      programName: request.programName,
      programType: request.programType,
      description: request.description,
      approvedBy: req.user.id,
    },
  });

  await prisma.programRequest.update({
    where: { id: request.id },
    data: {
      status: 'APPROVED',
      adminComments: adminComments || null,
      decidedAt: new Date(),
      decidedBy: req.user.id,
    },
  });

  await sendEmail({
    to: request.institution.user.email,
    subject: `Program Approval - ${request.programName}`,
    html: programDecisionEmail({
      institutionName: request.institution.name,
      programName: request.programName,
      status: 'approved',
      comments: adminComments || '',
    }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'PROGRAM_APPROVED',
    targetType: 'PROGRAM',
    targetId: program.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Program approved.' });
}

async function rejectProgram(req, res) {
  const { id } = req.params;
  const { adminComments } = req.body;
  if (!adminComments) {
    return res.status(400).json({ message: 'Admin comments are required.' });
  }

  const request = await prisma.programRequest.findUnique({
    where: { id },
    include: { institution: { include: { user: true } } },
  });

  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ message: 'Request not found or already handled.' });
  }

  await prisma.programRequest.update({
    where: { id: request.id },
    data: {
      status: 'REJECTED',
      adminComments,
      decidedAt: new Date(),
      decidedBy: req.user.id,
    },
  });

  await sendEmail({
    to: request.institution.user.email,
    subject: `Program Approval - ${request.programName}`,
    html: programDecisionEmail({
      institutionName: request.institution.name,
      programName: request.programName,
      status: 'rejected',
      comments: adminComments,
    }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'PROGRAM_REJECTED',
    targetType: 'PROGRAM_REQUEST',
    targetId: request.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Program rejected.' });
}

async function listInstitutions(req, res) {
  const institutions = await prisma.institution.findMany({
    include: {
      programs: true,
      user: {
        select: {
          email: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ institutions });
}

async function revokePermission(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  const institution = await prisma.institution.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!institution) {
    return res.status(404).json({ message: 'Institution not found.' });
  }

  await prisma.institution.update({
    where: { id },
    data: { canIssueCertificates: false },
  });

  await sendEmail({
    to: institution.user.email,
    subject: 'Important: Certificate Issuing Permission Update',
    html: permissionRevokedEmail({ institutionName: institution.name, reason }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'INSTITUTION_PERMISSION_REVOKED',
    targetType: 'INSTITUTION',
    targetId: institution.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Permission revoked.' });
}

async function grantPermission(req, res) {
  const { id } = req.params;
  const institution = await prisma.institution.findUnique({ where: { id } });
  if (!institution) {
    return res.status(404).json({ message: 'Institution not found.' });
  }

  await prisma.institution.update({
    where: { id },
    data: { canIssueCertificates: true },
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'INSTITUTION_PERMISSION_GRANTED',
    targetType: 'INSTITUTION',
    targetId: institution.id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Permission granted.' });
}

async function revokeProgram(req, res) {
  const { programId } = req.params;
  const program = await prisma.institutionProgram.findUnique({ where: { id: programId } });
  if (!program) {
    return res.status(404).json({ message: 'Program not found.' });
  }

  await prisma.institutionProgram.update({
    where: { id: programId },
    data: { isActive: false },
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'PROGRAM_REVOKED',
    targetType: 'PROGRAM',
    targetId: programId,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Program revoked.' });
}

async function activityLogs(req, res) {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return res.json({ logs });
}

async function listReports(req, res) {
  const reports = await prisma.issueReport.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ reports });
}

async function updateReport(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const report = await prisma.issueReport.findUnique({ where: { id } });
  if (!report) {
    return res.status(404).json({ message: 'Report not found.' });
  }

  const updated = await prisma.issueReport.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === 'RESOLVED' ? new Date() : report.resolvedAt,
    },
  });

  return res.json({ message: 'Report updated.', report: updated });
}

async function respondReport(req, res) {
  const { id } = req.params;
  const { response } = req.body;
  if (!response) {
    return res.status(400).json({ message: 'Response is required.' });
  }

  const report = await prisma.issueReport.findUnique({ where: { id } });
  if (!report) {
    return res.status(404).json({ message: 'Report not found.' });
  }

  const updated = await prisma.issueReport.update({
    where: { id },
    data: {
      adminResponse: response,
      status: report.status === 'NEW' ? 'IN_PROGRESS' : report.status,
    },
  });

  await sendEmail({
    to: report.reporterEmail,
    subject: `Support Ticket Update - ${report.ticketNumber}`,
    html: issueResponseEmail({ ticketNumber: report.ticketNumber, response }),
  });

  return res.json({ message: 'Response sent.', report: updated });
}

module.exports = {
  adminLogin,
  dashboard,
  pendingStudents,
  approveStudent,
  rejectStudent,
  pendingInstitutions,
  approveInstitution,
  rejectInstitution,
  pendingProfileChanges,
  approveProfileChange,
  rejectProfileChange,
  pendingPrograms,
  approveProgram,
  rejectProgram,
  listInstitutions,
  revokePermission,
  grantPermission,
  revokeProgram,
  activityLogs,
  listReports,
  updateReport,
  respondReport,
};
