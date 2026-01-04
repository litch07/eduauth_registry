const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, execute } = require('../config/database');
const { decryptIdentity } = require('../utils/encryption');
const { isStrongPassword } = require('../utils/validators');
const { sendEmail } = require('../utils/emailService');
const {
  profileRequestReceivedEmail,
  issueTicketConfirmationEmail,
  issueReportedEmail,
} = require('../utils/emailTemplates');
const { toPublicUploadPath, toAbsoluteUploadPath, safeUnlink } = require('../utils/fileUtils');
const { validateFileType } = require('../utils/fileValidation');
const { logActivity } = require('../utils/activityLogger');

function mapInstitution(row) {
  if (!row.institution_id) return null;
  return {
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
  };
}

async function getStudentByUserId(userId) {
  const rows = await query(
    `SELECT s.*, u.email AS userEmail, u.status AS userStatus
     FROM Student s
     JOIN Users u ON s.userId = u.id
     WHERE s.userId = ?
     LIMIT 1`,
    [userId]
  );
  if (!rows.length) return null;
  const student = rows[0];
  student.user = {
    email: student.userEmail,
    status: student.userStatus,
  };
  delete student.userEmail;
  delete student.userStatus;
  return student;
}

async function dashboard(req, res) {
  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const [enrollmentCountRows, certificateCountRows, pendingRequestRows] = await Promise.all([
    query('SELECT COUNT(*) AS count FROM Enrollment WHERE studentId = ?', [student.id]),
    query('SELECT COUNT(*) AS count FROM Certificate WHERE studentId = ?', [student.id]),
    query(
      "SELECT COUNT(*) AS count FROM EnrollmentRequest WHERE studentId = ? AND status = 'PENDING'",
      [student.id]
    ),
  ]);

  const enrollmentsRows = await query(
    `SELECT e.*, i.id AS institution_id, i.name AS institution_name, i.type AS institution_type,
            i.phone AS institution_phone, i.address AS institution_address, i.eiin AS institution_eiin,
            i.registrationNumber AS institution_registrationNumber, i.board AS institution_board,
            i.authorityName AS institution_authorityName, i.authorityTitle AS institution_authorityTitle,
            i.authoritySignature AS institution_authoritySignature, i.canIssueCertificates AS institution_canIssueCertificates
     FROM Enrollment e
     JOIN Institution i ON e.institutionId = i.id
     WHERE e.studentId = ?
     ORDER BY e.enrollmentDate DESC`,
    [student.id]
  );

  const enrollmentRequestsRows = await query(
    `SELECT er.*, i.id AS institution_id, i.name AS institution_name, i.type AS institution_type,
            i.phone AS institution_phone, i.address AS institution_address, i.eiin AS institution_eiin,
            i.registrationNumber AS institution_registrationNumber, i.board AS institution_board,
            i.authorityName AS institution_authorityName, i.authorityTitle AS institution_authorityTitle,
            i.authoritySignature AS institution_authoritySignature, i.canIssueCertificates AS institution_canIssueCertificates
     FROM EnrollmentRequest er
     JOIN Institution i ON er.institutionId = i.id
     WHERE er.studentId = ?
     ORDER BY er.createdAt DESC`,
    [student.id]
  );

  const certificatesRows = await query(
    `SELECT c.*, i.id AS institution_id, i.name AS institution_name, i.type AS institution_type,
            i.phone AS institution_phone, i.address AS institution_address, i.eiin AS institution_eiin,
            i.registrationNumber AS institution_registrationNumber, i.board AS institution_board,
            i.authorityName AS institution_authorityName, i.authorityTitle AS institution_authorityTitle,
            i.authoritySignature AS institution_authoritySignature, i.canIssueCertificates AS institution_canIssueCertificates
     FROM Certificate c
     JOIN Institution i ON c.institutionId = i.id
     WHERE c.studentId = ?
     ORDER BY c.issueDate DESC`,
    [student.id]
  );

  const enrollments = enrollmentsRows.map((row) => ({
    ...row,
    institution: mapInstitution(row),
  }));

  const enrollmentRequests = enrollmentRequestsRows.map((row) => ({
    ...row,
    institution: mapInstitution(row),
  }));

  const certificates = certificatesRows.map((row) => ({
    ...row,
    isPubliclyShareable: Boolean(row.isPubliclyShareable),
    institution: mapInstitution(row),
  }));

  return res.json({
    stats: {
      enrollments: enrollmentCountRows[0]?.count || 0,
      certificates: certificateCountRows[0]?.count || 0,
      pendingRequests: pendingRequestRows[0]?.count || 0,
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

  await execute('UPDATE Student SET studentPhoto = ?, updatedAt = NOW() WHERE id = ?', [
    newPhotoPath,
    student.id,
  ]);

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

  await execute('UPDATE Student SET phone = ?, updatedAt = NOW() WHERE id = ?', [phone, student.id]);

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

  const requestId = uuidv4();
  await execute(
    `INSERT INTO ProfileChangeRequest
      (id, studentId, changes, supportingDocs, reason, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
    [
      requestId,
      student.id,
      JSON.stringify(parsedChanges),
      docs.length ? JSON.stringify(docs) : null,
      reason,
    ]
  );

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
    targetId: requestId,
    ipAddress: req.ip,
  });

  return res.status(201).json({ message: 'Profile update request submitted.' });
}

async function getProfileRequests(req, res) {
  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const requests = await query(
    'SELECT * FROM ProfileChangeRequest WHERE studentId = ? ORDER BY createdAt DESC',
    [student.id]
  );

  return res.json({ requests });
}

async function getCertificates(req, res) {
  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const certificatesRows = await query(
    `SELECT c.*, i.id AS institution_id, i.name AS institution_name, i.type AS institution_type,
            i.phone AS institution_phone, i.address AS institution_address, i.eiin AS institution_eiin,
            i.registrationNumber AS institution_registrationNumber, i.board AS institution_board,
            i.authorityName AS institution_authorityName, i.authorityTitle AS institution_authorityTitle,
            i.authoritySignature AS institution_authoritySignature, i.canIssueCertificates AS institution_canIssueCertificates
     FROM Certificate c
     JOIN Institution i ON c.institutionId = i.id
     WHERE c.studentId = ?
     ORDER BY c.issueDate DESC`,
    [student.id]
  );

  const certificates = certificatesRows.map((row) => ({
    ...row,
    isPubliclyShareable: Boolean(row.isPubliclyShareable),
    institution: mapInstitution(row),
  }));

  return res.json({ certificates });
}

async function toggleCertificateSharing(req, res) {
  const { id } = req.params;
  const { isPubliclyShareable } = req.body;

  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const rows = await query(
    'SELECT id FROM Certificate WHERE id = ? AND studentId = ? LIMIT 1',
    [id, student.id]
  );
  if (!rows.length) {
    return res.status(404).json({ message: 'Certificate not found.' });
  }

  await execute(
    'UPDATE Certificate SET isPubliclyShareable = ?, updatedAt = NOW() WHERE id = ?',
    [isPubliclyShareable ? 1 : 0, id]
  );

  const updatedRows = await query('SELECT * FROM Certificate WHERE id = ? LIMIT 1', [id]);
  const updated = updatedRows[0];

  return res.json({
    message: 'Sharing preference updated.',
    certificate: updated ? { ...updated, isPubliclyShareable: Boolean(updated.isPubliclyShareable) } : null,
  });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required.' });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ message: 'New password does not meet complexity requirements.' });
  }

  const users = await query('SELECT password FROM Users WHERE id = ? LIMIT 1', [req.user.id]);
  const user = users[0];
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    return res.status(401).json({ message: 'Current password is incorrect.' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await execute('UPDATE Users SET password = ?, updatedAt = NOW() WHERE id = ?', [hashedPassword, req.user.id]);

  return res.json({ message: 'Password updated successfully.' });
}

async function reportIssue(req, res) {
  const { issueType, description, targetType, institutionId } = req.body;
  if (!issueType || !description) {
    return res.status(400).json({ message: 'Issue type and description are required.' });
  }

  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const resolvedTarget = targetType === 'INSTITUTION' ? 'INSTITUTION' : 'ADMIN';
  let targetInstitution = null;
  if (resolvedTarget === 'INSTITUTION') {
    if (!institutionId) {
      return res.status(400).json({ message: 'Institution is required for this issue type.' });
    }
    const enrollmentRows = await query(
      'SELECT id FROM Enrollment WHERE studentId = ? AND institutionId = ? LIMIT 1',
      [student.id, institutionId]
    );
    if (!enrollmentRows.length) {
      return res.status(400).json({ message: 'You are not enrolled in the selected institution.' });
    }
    const institutionRows = await query(
      `SELECT i.id, i.name, u.email AS userEmail
       FROM Institution i
       JOIN Users u ON i.userId = u.id
       WHERE i.id = ?
       LIMIT 1`,
      [institutionId]
    );
    targetInstitution = institutionRows[0];
    if (!targetInstitution) {
      return res.status(404).json({ message: 'Institution not found.' });
    }
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

  const reportId = uuidv4();
  await execute(
    `INSERT INTO IssueReport
      (id, ticketNumber, studentId, reporterEmail, reporterName, issueType, description, attachments, status,
       targetType, institutionId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, NOW(), NOW())`,
    [
      reportId,
      ticketNumber,
      student.id,
      student.user.email,
      `${student.firstName} ${student.lastName}`,
      issueType,
      description,
      attachments.length ? JSON.stringify(attachments) : null,
      resolvedTarget,
      targetInstitution ? targetInstitution.id : null,
    ]
  );

  await sendEmail({
    to: student.user.email,
    subject: `Support Ticket Created - ${ticketNumber}`,
    html: issueTicketConfirmationEmail({ ticketNumber, summary: issueType }),
  });
  if (resolvedTarget === 'INSTITUTION' && targetInstitution) {
    await sendEmail({
      to: targetInstitution.userEmail,
      subject: `New Student Issue Report - ${ticketNumber}`,
      html: issueReportedEmail({
        institutionName: targetInstitution.name,
        reporterName: `${student.firstName} ${student.lastName}`,
        ticketNumber,
        issueType,
        description,
      }),
    });
  }

  await logActivity({
    actorId: student.userId,
    actorType: 'STUDENT',
    actorName: `${student.firstName} ${student.lastName}`,
    action: 'ISSUE_REPORTED',
    targetType: 'ISSUE_REPORT',
    targetId: reportId,
    ipAddress: req.ip,
    institutionId: targetInstitution ? targetInstitution.id : null,
  });

  return res.status(201).json({ message: 'Issue reported successfully.', ticketNumber });
}

async function searchInstitutions(req, res) {
  const term = (req.query.term || '').trim();
  if (!term) {
    return res.status(400).json({ message: 'Search term is required.' });
  }

  const likeTerm = `%${term.toLowerCase()}%`;
  const institutionsRows = await query(
    `SELECT i.id, i.name, i.type, i.phone, i.address, i.eiin, i.registrationNumber, i.board,
            i.authorityName, i.authorityTitle, i.authoritySignature,
            u.email AS userEmail, u.status AS userStatus
     FROM Institution i
     JOIN Users u ON i.userId = u.id
     WHERE u.status = 'APPROVED'
       AND (
         LOWER(i.name) LIKE ?
         OR LOWER(COALESCE(i.eiin, '')) LIKE ?
         OR LOWER(COALESCE(i.registrationNumber, '')) LIKE ?
       )
     LIMIT 20`,
    [likeTerm, likeTerm, likeTerm]
  );

  const institutions = institutionsRows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    phone: row.phone,
    address: row.address,
    eiin: row.eiin,
    registrationNumber: row.registrationNumber,
    board: row.board,
    authorityName: row.authorityName,
    authorityTitle: row.authorityTitle,
    authoritySignature: row.authoritySignature,
    user: {
      email: row.userEmail,
      status: row.userStatus,
    },
  }));

  return res.json({ institutions });
}

async function createEnrollmentRequest(req, res) {
  const {
    institutionId,
    studentInstitutionId,
    enrollmentDate,
    department,
    className,
    courseName,
  } = req.body;

  if (!institutionId || !studentInstitutionId || !enrollmentDate) {
    return res.status(400).json({ message: 'Institution, student ID, and enrollment date are required.' });
  }

  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const existing = await query(
    "SELECT id FROM EnrollmentRequest WHERE studentId = ? AND institutionId = ? AND status = 'PENDING' LIMIT 1",
    [student.id, institutionId]
  );
  if (existing.length) {
    return res.status(409).json({ message: 'A pending request already exists for this institution.' });
  }

  const institutions = await query(
    `SELECT i.id, u.status
     FROM Institution i
     JOIN Users u ON i.userId = u.id
     WHERE i.id = ?
     LIMIT 1`,
    [institutionId]
  );
  if (!institutions.length || institutions[0].status !== 'APPROVED') {
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

  const requestId = uuidv4();
  await execute(
    `INSERT INTO EnrollmentRequest
      (id, studentId, institutionId, studentInstitutionId, enrollmentDate, department, className, courseName,
       supportingDocs, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
    [
      requestId,
      student.id,
      institutionId,
      studentInstitutionId,
      new Date(enrollmentDate),
      department || null,
      className || null,
      courseName || null,
      docs.length ? JSON.stringify(docs) : null,
    ]
  );

  await logActivity({
    actorId: student.userId,
    actorType: 'STUDENT',
    actorName: `${student.firstName} ${student.lastName}`,
    action: 'ENROLLMENT_REQUESTED',
    targetType: 'ENROLLMENT_REQUEST',
    targetId: requestId,
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

  const requestsRows = await query(
    `SELECT er.*, i.id AS institution_id, i.name AS institution_name, i.type AS institution_type,
            i.phone AS institution_phone, i.address AS institution_address, i.eiin AS institution_eiin,
            i.registrationNumber AS institution_registrationNumber, i.board AS institution_board,
            i.authorityName AS institution_authorityName, i.authorityTitle AS institution_authorityTitle,
            i.authoritySignature AS institution_authoritySignature, i.canIssueCertificates AS institution_canIssueCertificates
     FROM EnrollmentRequest er
     JOIN Institution i ON er.institutionId = i.id
     WHERE er.studentId = ?
     ORDER BY er.createdAt DESC`,
    [student.id]
  );

  const requests = requestsRows.map((row) => ({
    ...row,
    institution: mapInstitution(row),
  }));

  return res.json({ requests });
}

async function cancelEnrollmentRequest(req, res) {
  const { id } = req.params;
  const student = await getStudentByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const rows = await query(
    'SELECT id, status FROM EnrollmentRequest WHERE id = ? AND studentId = ? LIMIT 1',
    [id, student.id]
  );
  const request = rows[0];

  if (!request) {
    return res.status(404).json({ message: 'Request not found.' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ message: 'Only pending requests can be cancelled.' });
  }

  await execute('DELETE FROM EnrollmentRequest WHERE id = ?', [request.id]);

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
