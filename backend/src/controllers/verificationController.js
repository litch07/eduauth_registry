const { query } = require('../config/database');
const { validateCertificateSerial } = require('../utils/serialGenerator');

async function verifyCertificate(req, res) {
  const { serial, rollNumber } = req.body;
  if (!serial || !rollNumber) {
    return res.status(400).json({ message: 'Serial number and roll number are required.' });
  }

  if (!validateCertificateSerial(serial)) {
    return res.status(400).json({ message: 'Invalid certificate serial format.' });
  }

  const normalized = serial.trim().toUpperCase();
  const normalizedRoll = rollNumber.trim().toUpperCase();

  const rows = await query(
    `SELECT c.*, s.firstName AS student_firstName, s.lastName AS student_lastName, s.dateOfBirth AS student_dateOfBirth,
            i.name AS institution_name, i.type AS institution_type
     FROM Certificate c
     JOIN Student s ON c.studentId = s.id
     JOIN Institution i ON c.institutionId = i.id
     WHERE c.serial = ? AND c.rollNumber = ?
     LIMIT 1`,
    [normalized, normalizedRoll]
  );
  const certificate = rows[0];

  if (!certificate) {
    return res.status(404).json({ message: 'Certificate not found.' });
  }

  if (!certificate.isPubliclyShareable) {
    return res.status(403).json({
      message: 'This certificate is not available for public verification per the certificate holder\'s privacy settings.',
    });
  }

  return res.json({
    certificate: {
      serial: certificate.serial,
      certificateType: certificate.certificateType,
      issueDate: certificate.issueDate,
      studentName: `${certificate.student_firstName} ${certificate.student_lastName}`,
      dateOfBirth: certificate.student_dateOfBirth,
      institutionName: certificate.institution_name,
      institutionType: certificate.institution_type,
      rollNumber: certificate.rollNumber,
      gpa: certificate.gpa,
      cgpa: certificate.cgpa,
      board: certificate.board,
    },
  });
}

async function stats(req, res) {
  const [studentsRows, institutionsRows, certificatesRows] = await Promise.all([
    query("SELECT COUNT(*) AS count FROM Users WHERE role = 'STUDENT' AND status = 'APPROVED'"),
    query("SELECT COUNT(*) AS count FROM Users WHERE role = 'INSTITUTION' AND status = 'APPROVED'"),
    query('SELECT COUNT(*) AS count FROM Certificate'),
  ]);

  return res.json({
    students: studentsRows[0]?.count || 0,
    institutions: institutionsRows[0]?.count || 0,
    certificates: certificatesRows[0]?.count || 0,
  });
}

module.exports = { verifyCertificate, stats };
