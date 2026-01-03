const crypto = require('crypto');

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
const ENCRYPTION_IV = Buffer.from(process.env.ENCRYPTION_IV || '', 'hex');

function encryptIdentity(identity) {
  if (!identity) return null;
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, ENCRYPTION_IV);
  let encrypted = cipher.update(identity, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptIdentity(encryptedIdentity) {
  if (!encryptedIdentity) return null;
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, ENCRYPTION_IV);
  let decrypted = decipher.update(encryptedIdentity, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encryptIdentity, decryptIdentity };
