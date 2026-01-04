const { transaction } = require('../config/database');

async function generateCertificateSerial() {
  const sequence = await transaction(async (db) => {
    const rows = await db.query(
      'SELECT id, lastSequence FROM CertificateSequence ORDER BY id LIMIT 1 FOR UPDATE'
    );
    if (!rows.length) {
      await db.execute('INSERT INTO CertificateSequence (lastSequence, updatedAt) VALUES (?, NOW())', ['1']);
      return 1n;
    }

    const current = BigInt(rows[0].lastSequence);
    const nextSeq = current + 1n;
    await db.execute(
      'UPDATE CertificateSequence SET lastSequence = ?, updatedAt = NOW() WHERE id = ?',
      [nextSeq.toString(), rows[0].id]
    );
    return nextSeq;
  });

  const sequenceValue = typeof sequence === 'bigint' ? sequence : BigInt(sequence);
  const base36 = sequenceValue.toString(36).toUpperCase().padStart(6, '0');
  const weights = [7, 3, 1, 7, 3, 1];
  let sum = 0;

  for (let i = 0; i < 6; i += 1) {
    const value = parseInt(base36[i], 36);
    sum += value * weights[i];
  }

  const checkDigit = (sum % 36).toString(36).toUpperCase();
  const serial = base36 + checkDigit;

  return { serial, sequenceNumber: sequenceValue.toString() };
}

function validateCertificateSerial(serial) {
  if (!/^[0-9A-Z]{7}$/i.test(serial)) {
    return false;
  }
  const normalized = serial.toUpperCase();
  const base36 = normalized.substring(0, 6);
  const providedCheck = normalized[6];

  const weights = [7, 3, 1, 7, 3, 1];
  let sum = 0;

  for (let i = 0; i < 6; i += 1) {
    const value = parseInt(base36[i], 36);
    sum += value * weights[i];
  }

  const calculatedCheck = (sum % 36).toString(36).toUpperCase();
  return providedCheck === calculatedCheck;
}

module.exports = { generateCertificateSerial, validateCertificateSerial };
