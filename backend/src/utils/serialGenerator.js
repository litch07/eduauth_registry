async function generateCertificateSerial(prisma) {
  const sequence = await prisma.$transaction(async (tx) => {
    const seqRecord = await tx.certificateSequence.findFirst();
    if (!seqRecord) {
      const created = await tx.certificateSequence.create({
        data: { lastSequence: 1 },
      });
      return Number(created.lastSequence);
    }
    const nextSeq = Number(seqRecord.lastSequence) + 1;
    await tx.certificateSequence.update({
      where: { id: seqRecord.id },
      data: { lastSequence: nextSeq },
    });
    return nextSeq;
  });

  const base36 = sequence.toString(36).toUpperCase().padStart(6, '0');
  const weights = [7, 3, 1, 7, 3, 1];
  let sum = 0;

  for (let i = 0; i < 6; i += 1) {
    const value = parseInt(base36[i], 36);
    sum += value * weights[i];
  }

  const checkDigit = (sum % 36).toString(36).toUpperCase();
  const serial = base36 + checkDigit;

  return { serial, sequenceNumber: sequence };
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
