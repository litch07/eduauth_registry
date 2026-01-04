const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('en-GB');
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (value instanceof Date) {
    return formatDate(value);
  }
  if (typeof value === 'object' && typeof value.toString === 'function') {
    return value.toString();
  }
  return String(value);
}

function formatCertificateType(type) {
  if (!type) return '';
  return type.replace(/_/g, ' ');
}

async function generateCertificatePdf({ certificate, student, institution }) {
  const uploadsRoot = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', '..', 'uploads'));
  const outputDir = path.join(uploadsRoot, 'certificates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `${uuidv4()}.pdf`;
  const outputPath = path.join(outputDir, filename);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  doc.fontSize(10).fillColor('#111827');

  // Header
  doc.fontSize(20).fillColor('#1E40AF').text(institution.name, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(16).fillColor('#111827').text(`${formatCertificateType(certificate.certificateType)} Certificate`, { align: 'center' });

  // Serial + QR
  const qrBuffer = await QRCode.toBuffer(certificate.qrCodeData || '', { width: 110, margin: 1 });
  doc.image(qrBuffer, 430, 70, { width: 100, height: 100 });
  doc.fontSize(10).fillColor('#111827').text(`Serial No: ${certificate.serial}`, 400, 50, { align: 'right' });

  doc.moveDown(2.5);

  doc.fontSize(12).fillColor('#111827').text('This is to certify that', { align: 'center' });
  doc.moveDown(0.4);
  const studentName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.replace(/\s+/g, ' ').trim();
  doc.fontSize(18).fillColor('#111827').text(studentName, { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(11).text(`Date of Birth: ${formatDate(student.dateOfBirth)}`, { align: 'center' });

  doc.moveDown(1.2);

  // Academic details paragraph
  let detailsText = '';
  if (certificate.program) {
    detailsText = `has successfully completed ${certificate.program}`;
    if (certificate.major) detailsText += ` in ${certificate.major}`;
    if (certificate.department) detailsText += ` from the Department of ${certificate.department}`;
  } else if (certificate.certificateType) {
    detailsText = `has successfully completed the requirements for ${certificate.certificateType}`;
  }

  if (certificate.gpa) {
    detailsText += ` with GPA ${certificate.gpa}`;
  }
  if (certificate.cgpa) {
    detailsText += ` with CGPA ${certificate.cgpa}`;
  }

  doc.fontSize(12).text(detailsText, { align: 'center' });

  doc.moveDown(1.2);

  // Details table-like block
  const rows = [
    ['Student ID', student.studentId],
    ['Institution Student ID', certificate.studentInstitutionId],
    ['Roll Number', certificate.rollNumber],
    ['Registration Number', certificate.registrationNumber],
    ['Examination Year', certificate.examinationYear],
    ['Board', certificate.board],
    ['Group', certificate.groupName],
    ['GPA', certificate.gpa],
    ['Passing Year', certificate.passingYear],
    ['Diploma Subject', certificate.diplomaSubject],
    ['Duration', certificate.duration],
    ['Session', certificate.sessionName],
    ['Program', certificate.program],
    ['Department', certificate.department],
    ['Major', certificate.major],
    ['CGPA', certificate.cgpa],
    ['Degree Class', certificate.degreeClass],
    ['Convocation', certificate.convocationDate],
    ['Completion Date', certificate.completionDate],
    ['Skill Name', certificate.skillName],
  ]
    .map(([label, value]) => [label, formatValue(value)])
    .filter(([, value]) => value);

  const rowHeight = 16;
  const tableHeight = Math.max(60, rows.length * rowHeight + 16);
  doc.rect(70, doc.y, 460, tableHeight).stroke('#E5E7EB');
  const tableTop = doc.y + 12;
  doc.fontSize(10).fillColor('#111827');

  let currentY = tableTop;
  rows.forEach(([label, value]) => {
    doc.text(`${label}:`, 90, currentY);
    doc.text(String(value), 220, currentY);
    currentY += 16;
  });

  doc.moveDown(4);

  doc.fontSize(11).text(`Date of Issue: ${formatDate(certificate.issueDate)}`, { align: 'center' });

  doc.moveDown(2.5);

  // Signature
  const signaturePath = institution.authoritySignature || certificate.authoritySignature;
  if (signaturePath && fs.existsSync(signaturePath)) {
    doc.image(signaturePath, 230, doc.y, { width: 150, height: 50 });
    doc.moveDown(2.2);
  }

  doc.fontSize(11).text(certificate.authorityName, { align: 'center' });
  doc.fontSize(10).text(certificate.authorityTitle, { align: 'center' });

  doc.moveDown(2.5);
  doc.fontSize(9).fillColor('#6B7280').text('Verify at: eduauth.gov.bd/verify', { align: 'center' });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return outputPath;
}

module.exports = { generateCertificatePdf };
