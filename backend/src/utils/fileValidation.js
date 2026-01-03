const fs = require('fs');

function detectFileType(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 4) return null;

  const signature4 = buffer.slice(0, 4).toString('hex').toUpperCase();
  const signature3 = buffer.slice(0, 3).toString('hex').toUpperCase();

  if (signature4 === '25504446') {
    return 'application/pdf';
  }
  if (signature4 === '89504E47') {
    return 'image/png';
  }
  if (signature3 === 'FFD8FF') {
    return 'image/jpeg';
  }
  return null;
}

function validateFileType(filePath, allowedTypes) {
  const detected = detectFileType(filePath);
  return detected && allowedTypes.includes(detected);
}

module.exports = { detectFileType, validateFileType };
