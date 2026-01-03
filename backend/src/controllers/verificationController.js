const prisma = require('../config/database');
const { validateCertificateSerial } = require('../utils/serialGenerator');

async function verifyCertificate(req, res) {
  const { serial } = req.body;
  if (!serial) {
    return res.status(400).json({ message: 'Serial number is required.' });
  }

  if (!validateCertificateSerial(serial)) {
    return res.status(400).json({ message: 'Invalid certificate serial format.' });
  }

  const normalized = serial.toUpperCase();

  const certificate = await prisma.certificate.findFirst({
    where: { serial: normalized },
    include: { student: true, institution: true },
  });

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
      studentName: `${certificate.student.firstName} ${certificate.student.lastName}`,
      dateOfBirth: certificate.student.dateOfBirth,
      institutionName: certificate.institution.name,
      institutionType: certificate.institution.type,
      gpa: certificate.gpa,
      cgpa: certificate.cgpa,
      board: certificate.board,
    },
  });
}

async function stats(req, res) {
  const [students, institutions, certificates] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', status: 'APPROVED' } }),
    prisma.user.count({ where: { role: 'INSTITUTION', status: 'APPROVED' } }),
    prisma.certificate.count(),
  ]);

  return res.json({ students, institutions, certificates });
}

module.exports = { verifyCertificate, stats };
