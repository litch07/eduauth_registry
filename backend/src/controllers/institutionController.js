const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, execute } = require('../config/database');
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

function mapStudent(row) {
  if (!row.student_id) return null;
  const student = {
    id: row.student_id,
    firstName: row.student_firstName,
    middleName: row.student_middleName,
    lastName: row.student_lastName,
    dateOfBirth: row.student_dateOfBirth,
    studentId: row.student_studentId,
    studentPhoto: row.student_studentPhoto,
    phone: row.student_phone,
    presentAddress: row.student_presentAddress,
  };
  if (row.student_email) {
    student.user = {
      email: row.student_email,
      status: row.student_status,
    };
  }
  return student;
}

async function getInstitutionByUserId(userId) {
  const rows = await query(
    `SELECT i.*, u.email AS userEmail, u.status AS userStatus
     FROM Institution i
     JOIN Users u ON i.userId = u.id
     WHERE i.userId = ?
     LIMIT 1`,
    [userId]
  );
  if (!rows.length) return null;
  const institution = rows[0];
  institution.user = {
    email: institution.userEmail,
    status: institution.userStatus,
  };
  delete institution.userEmail;
  delete institution.userStatus;
  return institution;
}

async function dashboard(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const [studentCountRows, certificateCountRows, pendingRequestRows, programCountRows] = await Promise.all([
    query('SELECT COUNT(*) AS count FROM Enrollment WHERE institutionId = ?', [institution.id]),
    query('SELECT COUNT(*) AS count FROM Certificate WHERE institutionId = ?', [institution.id]),
    query(
      "SELECT COUNT(*) AS count FROM EnrollmentRequest WHERE institutionId = ? AND status = 'PENDING'",
      [institution.id]
    ),
    query(
      'SELECT COUNT(*) AS count FROM InstitutionProgram WHERE institutionId = ? AND isActive = 1',
      [institution.id]
    ),
  ]);

  const recentRows = await query(
    `SELECT c.*, s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName,
            s.lastName AS student_lastName
     FROM Certificate c
     JOIN Student s ON c.studentId = s.id
     WHERE c.institutionId = ?
     ORDER BY c.issueDate DESC
     LIMIT 10`,
    [institution.id]
  );

  const recentCertificates = recentRows.map((row) => ({
    ...row,
    student: mapStudent(row),
  }));

  return res.json({
    stats: {
      enrolledStudents: studentCountRows[0]?.count || 0,
      certificatesIssued: certificateCountRows[0]?.count || 0,
      pendingRequests: pendingRequestRows[0]?.count || 0,
      activePrograms: programCountRows[0]?.count || 0,
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
    canIssueCertificates: Boolean(institution.canIssueCertificates),
  });
}

async function searchStudents(req, res) {
  const { email, firstName, lastName, dateOfBirth, studentId } = req.query;

  let sql = '';
  let params = [];

  if (email) {
    sql = `SELECT s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName,
                  s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth, s.studentId AS student_studentId,
                  s.studentPhoto AS student_studentPhoto, u.email AS student_email, u.status AS student_status
           FROM Student s
           JOIN Users u ON s.userId = u.id
           WHERE u.status = 'APPROVED' AND LOWER(u.email) LIKE ?
           LIMIT 20`;
    params = [`%${email.toLowerCase()}%`];
  } else if (studentId) {
    sql = `SELECT s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName,
                  s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth, s.studentId AS student_studentId,
                  s.studentPhoto AS student_studentPhoto, u.email AS student_email, u.status AS student_status
           FROM Student s
           JOIN Users u ON s.userId = u.id
           WHERE u.status = 'APPROVED' AND LOWER(s.studentId) LIKE ?
           LIMIT 20`;
    params = [`%${studentId.toLowerCase()}%`];
  } else if (firstName && lastName && dateOfBirth) {
    sql = `SELECT s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName,
                  s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth, s.studentId AS student_studentId,
                  s.studentPhoto AS student_studentPhoto, u.email AS student_email, u.status AS student_status
           FROM Student s
           JOIN Users u ON s.userId = u.id
           WHERE u.status = 'APPROVED'
             AND LOWER(s.firstName) LIKE ?
             AND LOWER(s.lastName) LIKE ?
             AND s.dateOfBirth = ?
           LIMIT 20`;
    params = [`%${firstName.toLowerCase()}%`, `%${lastName.toLowerCase()}%`, new Date(dateOfBirth)];
  } else {
    return res.status(400).json({ message: 'Provide email, student ID, or full name with DOB.' });
  }

  const rows = await query(sql, params);
  const students = rows.map((row) => ({
    id: row.student_id,
    firstName: row.student_firstName,
    middleName: row.student_middleName,
    lastName: row.student_lastName,
    dateOfBirth: row.student_dateOfBirth,
    studentId: row.student_studentId,
    studentPhoto: row.student_studentPhoto,
    user: {
      email: row.student_email,
      status: row.student_status,
    },
  }));

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
    className,
    courseName,
  } = req.body;

  if (!studentId || !studentInstitutionId || !enrollmentDate) {
    return res.status(400).json({ message: 'Student, institution ID, and enrollment date are required.' });
  }

  const students = await query(
    `SELECT s.id AS student_id, s.firstName AS student_firstName, s.lastName AS student_lastName,
            u.email AS student_email, u.status AS student_status
     FROM Student s
     JOIN Users u ON s.userId = u.id
     WHERE s.id = ?
     LIMIT 1`,
    [studentId]
  );
  const student = students[0];
  if (!student || student.student_status !== 'APPROVED') {
    return res.status(404).json({ message: 'Student not found or not approved.' });
  }

  const existing = await query(
    'SELECT id FROM Enrollment WHERE studentId = ? AND institutionId = ? LIMIT 1',
    [studentId, institution.id]
  );
  if (existing.length) {
    return res.status(409).json({ message: 'Student already enrolled.' });
  }

  const enrollmentId = uuidv4();
  await execute(
    `INSERT INTO Enrollment
      (id, studentId, institutionId, studentInstitutionId, enrollmentDate, department, className, courseName, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      enrollmentId,
      studentId,
      institution.id,
      studentInstitutionId,
      new Date(enrollmentDate),
      department || null,
      className || null,
      courseName || null,
    ]
  );

  await sendEmail({
    to: student.student_email,
    subject: 'Enrollment Confirmed - EduAuth Registry',
    html: enrollmentApprovedEmail({
      studentName: `${student.student_firstName} ${student.student_lastName}`,
      institutionName: institution.name,
    }),
  });

  await logActivity({
    actorId: institution.userId,
    actorType: 'INSTITUTION',
    actorName: institution.name,
    action: 'ENROLLMENT_CREATED',
    targetType: 'ENROLLMENT',
    targetId: enrollmentId,
    institutionId: institution.id,
    ipAddress: req.ip,
  });

  return res.status(201).json({
    message: 'Student enrolled successfully.',
    enrollment: {
      id: enrollmentId,
      studentId,
      institutionId: institution.id,
      studentInstitutionId,
      enrollmentDate: new Date(enrollmentDate),
      department: department || null,
      className: className || null,
      courseName: courseName || null,
    },
  });
}

async function listStudents(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const rows = await query(
    `SELECT e.*, s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName,
            s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth, s.studentId AS student_studentId,
            s.studentPhoto AS student_studentPhoto
     FROM Enrollment e
     JOIN Student s ON e.studentId = s.id
     WHERE e.institutionId = ?
     ORDER BY e.enrollmentDate DESC`,
    [institution.id]
  );

  const enrollments = rows.map((row) => ({
    ...row,
    student: mapStudent(row),
  }));

  return res.json({ enrollments });
}

async function getStudentDetails(req, res) {
  const { id } = req.params;
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const rows = await query(
    `SELECT e.*, s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName,
            s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth, s.studentId AS student_studentId,
            s.studentPhoto AS student_studentPhoto, s.phone AS student_phone, s.presentAddress AS student_presentAddress
     FROM Enrollment e
     JOIN Student s ON e.studentId = s.id
     WHERE e.studentId = ? AND e.institutionId = ?
     LIMIT 1`,
    [id, institution.id]
  );

  const enrollmentRow = rows[0];
  if (!enrollmentRow) {
    return res.status(404).json({ message: 'Student not enrolled.' });
  }

  const certificates = await query(
    'SELECT * FROM Certificate WHERE studentId = ? AND institutionId = ? ORDER BY issueDate DESC',
    [id, institution.id]
  );

  const enrollment = {
    ...enrollmentRow,
    student: mapStudent(enrollmentRow),
  };

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
  if (!details.rollNumber || !details.rollNumber.trim()) {
    return res.status(400).json({ message: 'Roll number is required for verification.' });
  }

  const enrollmentRows = await query(
    'SELECT * FROM Enrollment WHERE studentId = ? AND institutionId = ? LIMIT 1',
    [studentId, institution.id]
  );
  const enrollment = enrollmentRows[0];
  if (!enrollment) {
    return res.status(400).json({ message: 'Student is not enrolled in this institution.' });
  }

  const studentRows = await query(
    `SELECT s.*, u.email AS userEmail
     FROM Student s
     JOIN Users u ON s.userId = u.id
     WHERE s.id = ?
     LIMIT 1`,
    [studentId]
  );
  const student = studentRows[0];
  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }
  student.user = { email: student.userEmail };
  delete student.userEmail;

  const { serial, sequenceNumber } = await generateCertificateSerial();
  const normalizedRoll = details.rollNumber.trim().toUpperCase();
  const qrCodeData = `${process.env.FRONTEND_URL}/verify?serial=${serial}&roll=${encodeURIComponent(normalizedRoll)}`;
  const issueDate = new Date();

  const certificateId = uuidv4();
  const certificatePayload = {
    id: certificateId,
    serial,
    sequenceNumber,
    certificateType,
    studentId,
    institutionId: institution.id,
    rollNumber: normalizedRoll,
    registrationNumber: details.registrationNumber || null,
    examinationYear: details.examinationYear ? Number(details.examinationYear) : null,
    board: details.board || institution.board || null,
    groupName: details.groupName || null,
    gpa: details.gpa ? Number(details.gpa) : null,
    passingYear: details.passingYear ? Number(details.passingYear) : null,
    diplomaSubject: details.diplomaSubject || null,
    duration: details.duration || null,
    sessionName: details.sessionName || null,
    program: details.program || null,
    department: details.department || null,
    major: details.major || null,
    cgpa: details.cgpa ? Number(details.cgpa) : null,
    degreeClass: details.degreeClass || null,
    convocationDate: details.convocationDate ? new Date(details.convocationDate) : null,
    completionDate: details.completionDate ? new Date(details.completionDate) : null,
    skillName: details.skillName || null,
    issueDate,
    authorityName: institution.authorityName,
    authorityTitle: institution.authorityTitle,
    authoritySignature: institution.authoritySignature,
    isPubliclyShareable: 1,
    qrCodeData,
    pdfPath: null,
  };

  await execute(
    `INSERT INTO Certificate
      (id, serial, sequenceNumber, certificateType, studentId, institutionId, rollNumber, registrationNumber,
       examinationYear, board, groupName, gpa, passingYear, diplomaSubject, duration, sessionName, program, department,
       major, cgpa, degreeClass, convocationDate, completionDate, skillName, issueDate, authorityName, authorityTitle,
       authoritySignature, isPubliclyShareable, qrCodeData, pdfPath, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      certificatePayload.id,
      certificatePayload.serial,
      certificatePayload.sequenceNumber,
      certificatePayload.certificateType,
      certificatePayload.studentId,
      certificatePayload.institutionId,
      certificatePayload.rollNumber,
      certificatePayload.registrationNumber,
      certificatePayload.examinationYear,
      certificatePayload.board,
      certificatePayload.groupName,
      certificatePayload.gpa,
      certificatePayload.passingYear,
      certificatePayload.diplomaSubject,
      certificatePayload.duration,
      certificatePayload.sessionName,
      certificatePayload.program,
      certificatePayload.department,
      certificatePayload.major,
      certificatePayload.cgpa,
      certificatePayload.degreeClass,
      certificatePayload.convocationDate,
      certificatePayload.completionDate,
      certificatePayload.skillName,
      certificatePayload.issueDate,
      certificatePayload.authorityName,
      certificatePayload.authorityTitle,
      certificatePayload.authoritySignature,
      certificatePayload.isPubliclyShareable,
      certificatePayload.qrCodeData,
      certificatePayload.pdfPath,
    ]
  );

  const signatureAbsolute = toAbsoluteUploadPath(institution.authoritySignature);
  const pdfPath = await generateCertificatePdf({
    certificate: { ...certificatePayload, studentInstitutionId: enrollment.studentInstitutionId },
    student,
    institution: { ...institution, authoritySignature: signatureAbsolute },
  });

  const publicPdfPath = toPublicUploadPath(pdfPath);
  await execute('UPDATE Certificate SET pdfPath = ?, updatedAt = NOW() WHERE id = ?', [
    publicPdfPath,
    certificateId,
  ]);

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
    targetId: certificateId,
    institutionId: institution.id,
    ipAddress: req.ip,
    details: { serial },
  });

  return res.status(201).json({
    message: 'Certificate issued successfully.',
    certificate: { ...certificatePayload, pdfPath: publicPdfPath, isPubliclyShareable: true },
  });
}

async function getCertificates(req, res) {
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const certificates = await query(
    'SELECT * FROM Certificate WHERE institutionId = ? ORDER BY issueDate DESC',
    [institution.id]
  );

  const formatted = certificates.map((row) => ({
    ...row,
    isPubliclyShareable: Boolean(row.isPubliclyShareable),
  }));

  return res.json({ certificates: formatted });
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

  const requestId = uuidv4();
  await execute(
    `INSERT INTO ProgramRequest
      (id, institutionId, programName, programType, description, supportingDocs, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
    [
      requestId,
      institution.id,
      programName,
      programType,
      description,
      docs.length ? JSON.stringify(docs) : null,
    ]
  );

  await logActivity({
    actorId: institution.userId,
    actorType: 'INSTITUTION',
    actorName: institution.name,
    action: 'PROGRAM_REQUESTED',
    targetType: 'PROGRAM_REQUEST',
    targetId: requestId,
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

  const programs = await query(
    'SELECT * FROM InstitutionProgram WHERE institutionId = ? AND isActive = 1 ORDER BY approvedAt DESC',
    [institution.id]
  );

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

  const reportId = uuidv4();
  await execute(
    `INSERT INTO IssueReport
      (id, ticketNumber, reporterEmail, reporterName, issueType, description, attachments, status,
       targetType, institutionId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW', 'ADMIN', ?, NOW(), NOW())`,
    [
      reportId,
      ticketNumber,
      institution.user.email,
      institution.name,
      issueType,
      description,
      attachments.length ? JSON.stringify(attachments) : null,
      institution.id,
    ]
  );

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
    targetId: reportId,
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

  const rows = await query(
    `SELECT er.*, s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName,
            s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth, s.studentId AS student_studentId,
            s.studentPhoto AS student_studentPhoto, u.email AS student_email, u.status AS student_status
     FROM EnrollmentRequest er
     JOIN Student s ON er.studentId = s.id
     JOIN Users u ON s.userId = u.id
     WHERE er.institutionId = ? AND er.status = 'PENDING'
     ORDER BY er.createdAt DESC`,
    [institution.id]
  );

  const requests = rows.map((row) => ({
    ...row,
    student: mapStudent(row),
  }));

  return res.json({ requests });
}

async function approveEnrollmentRequest(req, res) {
  const { id } = req.params;
  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const rows = await query(
    `SELECT er.*, s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName,
            s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth, s.studentId AS student_studentId,
            s.studentPhoto AS student_studentPhoto, u.email AS student_email, u.status AS student_status
     FROM EnrollmentRequest er
     JOIN Student s ON er.studentId = s.id
     JOIN Users u ON s.userId = u.id
     WHERE er.id = ? AND er.institutionId = ?
     LIMIT 1`,
    [id, institution.id]
  );
  const request = rows[0];

  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ message: 'Request not found or already handled.' });
  }

  const existing = await query(
    'SELECT id FROM Enrollment WHERE studentId = ? AND institutionId = ? LIMIT 1',
    [request.studentId, institution.id]
  );
  if (existing.length) {
    return res.status(409).json({ message: 'Student already enrolled.' });
  }

  const enrollmentId = uuidv4();
  await execute(
    `INSERT INTO Enrollment
      (id, studentId, institutionId, studentInstitutionId, enrollmentDate, department, className, courseName, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      enrollmentId,
      request.studentId,
      institution.id,
      request.studentInstitutionId,
      request.enrollmentDate,
      request.department,
      request.className,
      request.courseName,
    ]
  );

  await execute(
    `UPDATE EnrollmentRequest
     SET status = 'APPROVED', decidedAt = NOW(), decidedBy = ?, updatedAt = NOW()
     WHERE id = ?`,
    [institution.userId, request.id]
  );

  if (request.student_email) {
    await sendEmail({
      to: request.student_email,
      subject: 'Enrollment Confirmed - EduAuth Registry',
      html: enrollmentApprovedEmail({
        studentName: `${request.student_firstName} ${request.student_lastName}`,
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

  return res.json({
    message: 'Enrollment request approved.',
    enrollment: {
      id: enrollmentId,
      studentId: request.studentId,
      institutionId: institution.id,
      studentInstitutionId: request.studentInstitutionId,
      enrollmentDate: request.enrollmentDate,
      department: request.department,
      className: request.className,
      courseName: request.courseName,
    },
  });
}

async function rejectEnrollmentRequest(req, res) {
  const { id } = req.params;
  const { comments } = req.body;

  const institution = await getInstitutionByUserId(req.user.id);
  if (!institution) {
    return res.status(404).json({ message: 'Institution profile not found.' });
  }

  const rows = await query(
    `SELECT er.*, s.id AS student_id, s.firstName AS student_firstName, s.middleName AS student_middleName,
            s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth, s.studentId AS student_studentId,
            s.studentPhoto AS student_studentPhoto, u.email AS student_email, u.status AS student_status
     FROM EnrollmentRequest er
     JOIN Student s ON er.studentId = s.id
     JOIN Users u ON s.userId = u.id
     WHERE er.id = ? AND er.institutionId = ?
     LIMIT 1`,
    [id, institution.id]
  );
  const request = rows[0];

  if (!request || request.status !== 'PENDING') {
    return res.status(404).json({ message: 'Request not found or already handled.' });
  }

  await execute(
    `UPDATE EnrollmentRequest
     SET status = 'REJECTED', institutionComments = ?, decidedAt = NOW(), decidedBy = ?, updatedAt = NOW()
     WHERE id = ?`,
    [comments || null, institution.userId, request.id]
  );

  if (request.student_email) {
    await sendEmail({
      to: request.student_email,
      subject: 'Enrollment Request Update - EduAuth Registry',
      html: enrollmentRejectedEmail({
        studentName: `${request.student_firstName} ${request.student_lastName}`,
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

