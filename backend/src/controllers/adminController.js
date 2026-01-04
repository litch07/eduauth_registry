const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, execute } = require('../config/database');
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

function mapStudentFromRow(row) {
  if (!row.student_id) return null;
  return {
    id: row.student_id,
    firstName: row.student_firstName,
    middleName: row.student_middleName,
    lastName: row.student_lastName,
    dateOfBirth: row.student_dateOfBirth,
    fatherName: row.student_fatherName,
    motherName: row.student_motherName,
    identityType: row.student_identityType,
    nidEncrypted: row.student_nidEncrypted,
    birthCertEncrypted: row.student_birthCertEncrypted,
    phone: row.student_phone,
    presentAddress: row.student_presentAddress,
    nidOrBirthCertImage: row.student_nidOrBirthCertImage,
    studentPhoto: row.student_studentPhoto,
    studentId: row.student_studentId,
    createdAt: row.student_createdAt,
  };
}

async function adminLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const rows = await query('SELECT * FROM Admins WHERE email = ? LIMIT 1', [email]);
  const admin = rows[0];
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
    pendingStudentsRows,
    pendingInstitutionsRows,
    pendingProfileRows,
    pendingProgramsRows,
    totalStudentsRows,
    totalInstitutionsRows,
    totalCertificatesRows,
  ] = await Promise.all([
    query("SELECT COUNT(*) AS count FROM Users WHERE role = 'STUDENT' AND status = 'PENDING_APPROVAL'"),
    query("SELECT COUNT(*) AS count FROM Users WHERE role = 'INSTITUTION' AND status = 'PENDING_APPROVAL'"),
    query("SELECT COUNT(*) AS count FROM ProfileChangeRequest WHERE status = 'PENDING'"),
    query("SELECT COUNT(*) AS count FROM ProgramRequest WHERE status = 'PENDING'"),
    query("SELECT COUNT(*) AS count FROM Users WHERE role = 'STUDENT' AND status = 'APPROVED'"),
    query("SELECT COUNT(*) AS count FROM Users WHERE role = 'INSTITUTION' AND status = 'APPROVED'"),
    query('SELECT COUNT(*) AS count FROM Certificate'),
  ]);

  const recentLogs = await query('SELECT * FROM ActivityLog ORDER BY createdAt DESC LIMIT 20');

  return res.json({
    stats: {
      pendingStudents: pendingStudentsRows[0]?.count || 0,
      pendingInstitutions: pendingInstitutionsRows[0]?.count || 0,
      pendingProfileChanges: pendingProfileRows[0]?.count || 0,
      pendingPrograms: pendingProgramsRows[0]?.count || 0,
      totalStudents: totalStudentsRows[0]?.count || 0,
      totalInstitutions: totalInstitutionsRows[0]?.count || 0,
      totalCertificates: totalCertificatesRows[0]?.count || 0,
    },
    recentLogs,
  });
}

async function listStudents(req, res) {
  const search = (req.query.search || '').trim().toLowerCase();
  const status = (req.query.status || '').trim().toUpperCase();

  let sql = `SELECT u.id AS user_id, u.email AS user_email, u.role AS user_role, u.status AS user_status,
                    u.createdAt AS user_createdAt,
                    s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName,
                    s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth, s.fatherName AS student_fatherName,
                    s.motherName AS student_motherName, s.identityType AS student_identityType, s.nidEncrypted AS student_nidEncrypted,
                    s.birthCertEncrypted AS student_birthCertEncrypted, s.phone AS student_phone,
                    s.presentAddress AS student_presentAddress, s.nidOrBirthCertImage AS student_nidOrBirthCertImage,
                    s.studentPhoto AS student_studentPhoto, s.studentId AS student_studentId, s.createdAt AS student_createdAt
             FROM Users u
             JOIN Student s ON s.userId = u.id
             WHERE u.role = 'STUDENT'`;
  const params = [];

  if (status) {
    sql += ' AND u.status = ?';
    params.push(status);
  }

  if (search) {
    sql += ` AND (
      LOWER(u.email) LIKE ?
      OR LOWER(s.firstName) LIKE ?
      OR LOWER(s.lastName) LIKE ?
      OR LOWER(CONCAT(s.firstName, ' ', s.lastName)) LIKE ?
      OR LOWER(s.studentId) LIKE ?
      OR LOWER(s.phone) LIKE ?
    )`;
    const likeTerm = `%${search}%`;
    params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);
  }

  sql += ' ORDER BY u.createdAt DESC LIMIT 200';

  const rows = await query(sql, params);
  const users = rows.map((row) => {
    const student = mapStudentFromRow(row);
    let identityNumber = null;
    if (student) {
      identityNumber = student.identityType === 'NID'
        ? decryptIdentity(student.nidEncrypted)
        : decryptIdentity(student.birthCertEncrypted);
    }
    if (student) {
      delete student.nidEncrypted;
      delete student.birthCertEncrypted;
    }
    return {
      id: row.user_id,
      email: row.user_email,
      role: row.user_role,
      status: row.user_status,
      createdAt: row.user_createdAt,
      student: student
        ? {
            ...student,
            identityNumber,
          }
        : null,
    };
  });

  return res.json({ users });
}

async function listCertificates(req, res) {
  const serial = (req.query.serial || '').trim().toUpperCase();
  const rollNumber = (req.query.rollNumber || '').trim().toUpperCase();
  const student = (req.query.student || '').trim().toLowerCase();
  const institution = (req.query.institution || '').trim().toLowerCase();

  let sql = `SELECT c.*, s.firstName AS student_firstName, s.lastName AS student_lastName,
                    s.studentId AS student_studentId, u.email AS student_email,
                    i.name AS institution_name, i.type AS institution_type, i.eiin AS institution_eiin,
                    i.registrationNumber AS institution_registrationNumber
             FROM Certificate c
             JOIN Student s ON c.studentId = s.id
             JOIN Users u ON s.userId = u.id
             JOIN Institution i ON c.institutionId = i.id
             WHERE 1=1`;
  const params = [];

  if (serial) {
    sql += ' AND c.serial = ?';
    params.push(serial);
  }
  if (rollNumber) {
    sql += ' AND c.rollNumber = ?';
    params.push(rollNumber);
  }
  if (student) {
    sql += ` AND (
      LOWER(CONCAT(s.firstName, ' ', s.lastName)) LIKE ?
      OR LOWER(s.studentId) LIKE ?
      OR LOWER(u.email) LIKE ?
    )`;
    const likeTerm = `%${student}%`;
    params.push(likeTerm, likeTerm, likeTerm);
  }
  if (institution) {
    sql += ` AND (
      LOWER(i.name) LIKE ?
      OR LOWER(COALESCE(i.eiin, '')) LIKE ?
      OR LOWER(COALESCE(i.registrationNumber, '')) LIKE ?
    )`;
    const likeTerm = `%${institution}%`;
    params.push(likeTerm, likeTerm, likeTerm);
  }

  sql += ' ORDER BY c.issueDate DESC LIMIT 200';

  const rows = await query(sql, params);
  const certificates = rows.map((row) => ({
    ...row,
    isPubliclyShareable: Boolean(row.isPubliclyShareable),
    student: {
      firstName: row.student_firstName,
      lastName: row.student_lastName,
      studentId: row.student_studentId,
      email: row.student_email,
    },
    institution: {
      name: row.institution_name,
      type: row.institution_type,
      eiin: row.institution_eiin,
      registrationNumber: row.institution_registrationNumber,
    },
  }));

  return res.json({ certificates });
}

async function pendingStudents(req, res) {
  const rows = await query(
    `SELECT u.id AS user_id, u.email AS user_email, u.role AS user_role, u.status AS user_status, u.createdAt AS user_createdAt,
            s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName, s.lastName AS student_lastName,
            s.dateOfBirth AS student_dateOfBirth, s.fatherName AS student_fatherName, s.motherName AS student_motherName,
            s.identityType AS student_identityType, s.nidEncrypted AS student_nidEncrypted, s.birthCertEncrypted AS student_birthCertEncrypted,
            s.phone AS student_phone, s.presentAddress AS student_presentAddress, s.nidOrBirthCertImage AS student_nidOrBirthCertImage,
            s.studentPhoto AS student_studentPhoto, s.studentId AS student_studentId, s.createdAt AS student_createdAt
     FROM Users u
     JOIN Student s ON s.userId = u.id
     WHERE u.role = 'STUDENT' AND u.status = 'PENDING_APPROVAL'
     ORDER BY u.createdAt DESC`
  );

  const users = rows.map((row) => {
    const student = mapStudentFromRow(row);
    let identityNumber = null;
    if (student) {
      identityNumber = student.identityType === 'NID'
        ? decryptIdentity(student.nidEncrypted)
        : decryptIdentity(student.birthCertEncrypted);
    }
    if (student) {
      delete student.nidEncrypted;
      delete student.birthCertEncrypted;
    }
    return {
      id: row.user_id,
      email: row.user_email,
      role: row.user_role,
      status: row.user_status,
      createdAt: row.user_createdAt,
      student: student
        ? {
            ...student,
            identityNumber,
          }
        : null,
    };
  });

  return res.json({ users });
}

async function approveStudent(req, res) {
  const { id } = req.params;
  const rows = await query(
    `SELECT s.id AS student_id, s.userId AS student_userId, s.firstName AS student_firstName,
            s.lastName AS student_lastName, u.email AS user_email
     FROM Student s
     JOIN Users u ON s.userId = u.id
     WHERE s.id = ?
     LIMIT 1`,
    [id]
  );
  const student = rows[0];

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  await execute("UPDATE Users SET status = 'APPROVED', updatedAt = NOW() WHERE id = ?", [student.student_userId]);
  await execute('UPDATE Student SET rejectionReason = NULL, updatedAt = NOW() WHERE id = ?', [student.student_id]);

  await sendEmail({
    to: student.user_email,
    subject: 'Your Registration Has Been Approved',
    html: registrationApprovedEmail({ name: student.student_firstName, loginUrl: `${process.env.FRONTEND_URL}/login` }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'STUDENT_APPROVED',
    targetType: 'STUDENT',
    targetId: student.student_id,
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

  const rows = await query(
    `SELECT s.id AS student_id, s.userId AS student_userId, s.firstName AS student_firstName,
            s.middleName AS student_middleName, s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth,
            s.identityType AS student_identityType, s.phone AS student_phone, s.presentAddress AS student_presentAddress,
            u.email AS user_email
     FROM Student s
     JOIN Users u ON s.userId = u.id
     WHERE s.id = ?
     LIMIT 1`,
    [id]
  );
  const student = rows[0];

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  await execute("UPDATE Users SET status = 'REJECTED', updatedAt = NOW() WHERE id = ?", [student.student_userId]);
  await execute('UPDATE Student SET rejectionReason = ?, updatedAt = NOW() WHERE id = ?', [
    reason,
    student.student_id,
  ]);

  await sendEmail({
    to: student.user_email,
    subject: 'Registration Status Update',
    html: registrationRejectedEmail({
      name: student.student_firstName,
      reason,
      registerUrl: `${process.env.FRONTEND_URL}/register/student`,
      submittedData: {
        'Full Name': `${student.student_firstName} ${student.student_middleName || ''} ${student.student_lastName}`
          .replace(/\s+/g, ' ')
          .trim(),
        'Date of Birth': student.student_dateOfBirth
          ? new Date(student.student_dateOfBirth).toLocaleDateString('en-GB')
          : '',
        'Identity Type': student.student_identityType,
        Phone: student.student_phone,
        Address: student.student_presentAddress,
      },
    }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'STUDENT_REJECTED',
    targetType: 'STUDENT',
    targetId: student.student_id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Student rejected.' });
}

async function pendingInstitutions(req, res) {
  const rows = await query(
    `SELECT u.id AS user_id, u.email AS user_email, u.role AS user_role, u.status AS user_status, u.createdAt AS user_createdAt,
            i.id AS institution_id, i.name AS institution_name, i.type AS institution_type, i.phone AS institution_phone,
            i.address AS institution_address, i.eiin AS institution_eiin, i.registrationNumber AS institution_registrationNumber,
            i.board AS institution_board, i.authorityName AS institution_authorityName, i.authorityTitle AS institution_authorityTitle,
            i.authoritySignature AS institution_authoritySignature, i.canIssueCertificates AS institution_canIssueCertificates,
            i.rejectionReason AS institution_rejectionReason, i.createdAt AS institution_createdAt
     FROM Users u
     JOIN Institution i ON i.userId = u.id
     WHERE u.role = 'INSTITUTION' AND u.status = 'PENDING_APPROVAL'
     ORDER BY u.createdAt DESC`
  );

  const users = rows.map((row) => ({
    id: row.user_id,
    email: row.user_email,
    role: row.user_role,
    status: row.user_status,
    createdAt: row.user_createdAt,
    institution: {
      id: row.institution_id,
      name: row.institution_name,
      type: row.institution_type,
      phone: row.institution_phone,
      address: row.institution_address,
      eiin: row.institution_eiin,
      registrationNumber: row.institution_registrationNumber,
      board: row.institution_board,
      authorityName: row.institution_authorityName,
      authorityTitle: row.institution_authorityTitle,
      authoritySignature: row.institution_authoritySignature,
      canIssueCertificates: Boolean(row.institution_canIssueCertificates),
      rejectionReason: row.institution_rejectionReason,
      createdAt: row.institution_createdAt,
    },
  }));

  return res.json({ users });
}

async function approveInstitution(req, res) {
  const { id } = req.params;
  const rows = await query(
    `SELECT i.id AS institution_id, i.userId AS institution_userId, i.name AS institution_name,
            u.email AS user_email
     FROM Institution i
     JOIN Users u ON i.userId = u.id
     WHERE i.id = ?
     LIMIT 1`,
    [id]
  );
  const institution = rows[0];

  if (!institution) {
    return res.status(404).json({ message: 'Institution not found.' });
  }

  await execute("UPDATE Users SET status = 'APPROVED', updatedAt = NOW() WHERE id = ?", [
    institution.institution_userId,
  ]);
  await execute('UPDATE Institution SET rejectionReason = NULL, updatedAt = NOW() WHERE id = ?', [
    institution.institution_id,
  ]);

  await sendEmail({
    to: institution.user_email,
    subject: 'Your Registration Has Been Approved',
    html: registrationApprovedEmail({ name: institution.institution_name, loginUrl: `${process.env.FRONTEND_URL}/login` }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'INSTITUTION_APPROVED',
    targetType: 'INSTITUTION',
    targetId: institution.institution_id,
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

  const rows = await query(
    `SELECT i.id AS institution_id, i.userId AS institution_userId, i.name AS institution_name,
            i.type AS institution_type, i.phone AS institution_phone, i.address AS institution_address,
            i.eiin AS institution_eiin, i.registrationNumber AS institution_registrationNumber, i.board AS institution_board,
            i.authorityName AS institution_authorityName, i.authorityTitle AS institution_authorityTitle,
            u.email AS user_email
     FROM Institution i
     JOIN Users u ON i.userId = u.id
     WHERE i.id = ?
     LIMIT 1`,
    [id]
  );
  const institution = rows[0];

  if (!institution) {
    return res.status(404).json({ message: 'Institution not found.' });
  }

  await execute("UPDATE Users SET status = 'REJECTED', updatedAt = NOW() WHERE id = ?", [
    institution.institution_userId,
  ]);
  await execute('UPDATE Institution SET rejectionReason = ?, updatedAt = NOW() WHERE id = ?', [
    reason,
    institution.institution_id,
  ]);

  await sendEmail({
    to: institution.user_email,
    subject: 'Registration Status Update',
    html: registrationRejectedEmail({
      name: institution.institution_name,
      reason,
      registerUrl: `${process.env.FRONTEND_URL}/register/institution`,
      submittedData: {
        'Institution Name': institution.institution_name,
        Type: institution.institution_type,
        Phone: institution.institution_phone,
        Address: institution.institution_address,
        EIIN: institution.institution_eiin || '',
        'Registration Number': institution.institution_registrationNumber || '',
        Board: institution.institution_board || '',
        'Authority Name': institution.institution_authorityName,
        'Authority Title': institution.institution_authorityTitle,
      },
    }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'INSTITUTION_REJECTED',
    targetType: 'INSTITUTION',
    targetId: institution.institution_id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Institution rejected.' });
}

async function pendingProfileChanges(req, res) {
  const rows = await query(
    `SELECT p.*, s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName,
            s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth, s.studentId AS student_studentId,
            u.email AS student_email, u.status AS student_status
     FROM ProfileChangeRequest p
     JOIN Student s ON p.studentId = s.id
     JOIN Users u ON s.userId = u.id
     WHERE p.status = 'PENDING'
     ORDER BY p.createdAt DESC`
  );

  const requests = rows.map((row) => ({
    ...row,
    student: {
      id: row.student_id,
      firstName: row.student_firstName,
      middleName: row.student_middleName,
      lastName: row.student_lastName,
      dateOfBirth: row.student_dateOfBirth,
      studentId: row.student_studentId,
      user: {
        email: row.student_email,
        status: row.student_status,
      },
    },
  }));

  return res.json({ requests });
}

async function approveProfileChange(req, res) {
  const { id } = req.params;
  const { adminComments } = req.body;

  const rows = await query(
    `SELECT p.*, s.id AS student_id, s.firstName AS student_firstName, u.email AS student_email
     FROM ProfileChangeRequest p
     JOIN Student s ON p.studentId = s.id
     JOIN Users u ON s.userId = u.id
     WHERE p.id = ?
     LIMIT 1`,
    [id]
  );
  const request = rows[0];

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

  const updateKeys = Object.keys(updates);
  if (updateKeys.length) {
    const setClause = updateKeys.map((field) => `${field} = ?`).join(', ');
    const values = updateKeys.map((field) => updates[field]);
    await execute(`UPDATE Student SET ${setClause}, updatedAt = NOW() WHERE id = ?`, [
      ...values,
      request.studentId,
    ]);
  }

  await execute(
    `UPDATE ProfileChangeRequest
     SET status = 'APPROVED', adminComments = ?, decidedAt = NOW(), decidedBy = ?, updatedAt = NOW()
     WHERE id = ?`,
    [adminComments || null, req.user.id, request.id]
  );

  await sendEmail({
    to: request.student_email,
    subject: 'Profile Update Approved',
    html: profileRequestApprovedEmail({
      name: request.student_firstName,
      summary: updateKeys.join(', '),
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

  const rows = await query(
    `SELECT p.*, s.firstName AS student_firstName, u.email AS student_email
     FROM ProfileChangeRequest p
     JOIN Student s ON p.studentId = s.id
     JOIN Users u ON s.userId = u.id
     WHERE p.id = ?
     LIMIT 1`,
    [id]
  );
  const request = rows[0];

  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ message: 'Request not found or already handled.' });
  }

  await execute(
    `UPDATE ProfileChangeRequest
     SET status = 'REJECTED', adminComments = ?, decidedAt = NOW(), decidedBy = ?, updatedAt = NOW()
     WHERE id = ?`,
    [adminComments, req.user.id, request.id]
  );

  await sendEmail({
    to: request.student_email,
    subject: 'Profile Update Request - Action Required',
    html: profileRequestRejectedEmail({ name: request.student_firstName, reason: adminComments }),
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
  const rows = await query(
    `SELECT p.*, i.id AS institution_id, i.name AS institution_name,
            u.email AS user_email, u.status AS user_status
     FROM ProgramRequest p
     JOIN Institution i ON p.institutionId = i.id
     JOIN Users u ON i.userId = u.id
     WHERE p.status = 'PENDING'
     ORDER BY p.createdAt DESC`
  );

  const requests = rows.map((row) => ({
    ...row,
    institution: {
      id: row.institution_id,
      name: row.institution_name,
      user: {
        email: row.user_email,
        status: row.user_status,
      },
    },
  }));

  return res.json({ requests });
}

async function approveProgram(req, res) {
  const { id } = req.params;
  const { adminComments } = req.body;

  const rows = await query(
    `SELECT p.*, i.name AS institution_name, u.email AS user_email
     FROM ProgramRequest p
     JOIN Institution i ON p.institutionId = i.id
     JOIN Users u ON i.userId = u.id
     WHERE p.id = ?
     LIMIT 1`,
    [id]
  );
  const request = rows[0];

  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ message: 'Request not found or already handled.' });
  }

  const programId = uuidv4();
  await execute(
    `INSERT INTO InstitutionProgram
      (id, institutionId, programName, programType, description, isActive, approvedAt, approvedBy)
     VALUES (?, ?, ?, ?, ?, 1, NOW(), ?)`,
    [programId, request.institutionId, request.programName, request.programType, request.description, req.user.id]
  );

  await execute(
    `UPDATE ProgramRequest
     SET status = 'APPROVED', adminComments = ?, decidedAt = NOW(), decidedBy = ?, updatedAt = NOW()
     WHERE id = ?`,
    [adminComments || null, req.user.id, request.id]
  );

  await sendEmail({
    to: request.user_email,
    subject: `Program Approval - ${request.programName}`,
    html: programDecisionEmail({
      institutionName: request.institution_name,
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
    targetId: programId,
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

  const rows = await query(
    `SELECT p.*, i.name AS institution_name, u.email AS user_email
     FROM ProgramRequest p
     JOIN Institution i ON p.institutionId = i.id
     JOIN Users u ON i.userId = u.id
     WHERE p.id = ?
     LIMIT 1`,
    [id]
  );
  const request = rows[0];

  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ message: 'Request not found or already handled.' });
  }

  await execute(
    `UPDATE ProgramRequest
     SET status = 'REJECTED', adminComments = ?, decidedAt = NOW(), decidedBy = ?, updatedAt = NOW()
     WHERE id = ?`,
    [adminComments, req.user.id, request.id]
  );

  await sendEmail({
    to: request.user_email,
    subject: `Program Approval - ${request.programName}`,
    html: programDecisionEmail({
      institutionName: request.institution_name,
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
  const institutionRows = await query(
    `SELECT i.*, u.email AS user_email, u.status AS user_status
     FROM Institution i
     JOIN Users u ON i.userId = u.id
     ORDER BY i.createdAt DESC`
  );
  const programRows = await query('SELECT * FROM InstitutionProgram');

  const programsByInstitution = programRows.reduce((acc, program) => {
    if (!acc[program.institutionId]) acc[program.institutionId] = [];
    acc[program.institutionId].push(program);
    return acc;
  }, {});

  const institutions = institutionRows.map((row) => ({
    ...row,
    canIssueCertificates: Boolean(row.canIssueCertificates),
    user: {
      email: row.user_email,
      status: row.user_status,
    },
    programs: programsByInstitution[row.id] || [],
  }));

  return res.json({ institutions });
}

async function revokePermission(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  const rows = await query(
    `SELECT i.id AS institution_id, i.name AS institution_name, u.email AS user_email
     FROM Institution i
     JOIN Users u ON i.userId = u.id
     WHERE i.id = ?
     LIMIT 1`,
    [id]
  );
  const institution = rows[0];
  if (!institution) {
    return res.status(404).json({ message: 'Institution not found.' });
  }

  await execute('UPDATE Institution SET canIssueCertificates = 0, updatedAt = NOW() WHERE id = ?', [
    institution.institution_id,
  ]);

  await sendEmail({
    to: institution.user_email,
    subject: 'Important: Certificate Issuing Permission Update',
    html: permissionRevokedEmail({ institutionName: institution.institution_name, reason }),
  });

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'INSTITUTION_PERMISSION_REVOKED',
    targetType: 'INSTITUTION',
    targetId: institution.institution_id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Permission revoked.' });
}

async function grantPermission(req, res) {
  const { id } = req.params;
  const rows = await query('SELECT id FROM Institution WHERE id = ? LIMIT 1', [id]);
  if (!rows.length) {
    return res.status(404).json({ message: 'Institution not found.' });
  }

  await execute('UPDATE Institution SET canIssueCertificates = 1, updatedAt = NOW() WHERE id = ?', [id]);

  await logActivity({
    actorId: req.user.id,
    actorType: 'ADMIN',
    actorName: req.user.email,
    action: 'INSTITUTION_PERMISSION_GRANTED',
    targetType: 'INSTITUTION',
    targetId: id,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Permission granted.' });
}

async function revokeProgram(req, res) {
  const { programId } = req.params;
  const rows = await query('SELECT id FROM InstitutionProgram WHERE id = ? LIMIT 1', [programId]);
  if (!rows.length) {
    return res.status(404).json({ message: 'Program not found.' });
  }

  await execute('UPDATE InstitutionProgram SET isActive = 0 WHERE id = ?', [programId]);

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
  const logs = await query('SELECT * FROM ActivityLog ORDER BY createdAt DESC LIMIT 100');
  return res.json({ logs });
}

async function listReports(req, res) {
  const rows = await query(
    `SELECT ir.*, i.name AS institution_name
     FROM IssueReport ir
     LEFT JOIN Institution i ON ir.institutionId = i.id
     ORDER BY ir.createdAt DESC`
  );
  const reports = rows.map((row) => ({
    ...row,
    institutionName: row.institution_name || null,
  }));
  return res.json({ reports });
}

async function updateReport(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const rows = await query('SELECT resolvedAt FROM IssueReport WHERE id = ? LIMIT 1', [id]);
  const report = rows[0];
  if (!report) {
    return res.status(404).json({ message: 'Report not found.' });
  }

  const resolvedAt = status === 'RESOLVED' ? new Date() : report.resolvedAt;
  await execute(
    'UPDATE IssueReport SET status = ?, resolvedAt = ?, updatedAt = NOW() WHERE id = ?',
    [status, resolvedAt, id]
  );

  const updatedRows = await query('SELECT * FROM IssueReport WHERE id = ? LIMIT 1', [id]);
  const updated = updatedRows[0];

  return res.json({ message: 'Report updated.', report: updated });
}

async function respondReport(req, res) {
  const { id } = req.params;
  const { response } = req.body;
  if (!response) {
    return res.status(400).json({ message: 'Response is required.' });
  }

  const rows = await query('SELECT * FROM IssueReport WHERE id = ? LIMIT 1', [id]);
  const report = rows[0];
  if (!report) {
    return res.status(404).json({ message: 'Report not found.' });
  }

  const nextStatus = report.status === 'NEW' ? 'IN_PROGRESS' : report.status;
  await execute(
    'UPDATE IssueReport SET adminResponse = ?, status = ?, updatedAt = NOW() WHERE id = ?',
    [response, nextStatus, id]
  );

  await sendEmail({
    to: report.reporterEmail,
    subject: `Support Ticket Update - ${report.ticketNumber}`,
    html: issueResponseEmail({ ticketNumber: report.ticketNumber, response }),
  });

  const updatedRows = await query('SELECT * FROM IssueReport WHERE id = ? LIMIT 1', [id]);
  const updated = updatedRows[0];

  return res.json({ message: 'Response sent.', report: updated });
}

module.exports = {
  adminLogin,
  dashboard,
  listStudents,
  listCertificates,
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

