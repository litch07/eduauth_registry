function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

function isStrongPassword(password) {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

function isValidNid(nid) {
  return /^\d{10}(\d{3})?$/.test(nid || '');
}

function isValidBirthCert(birthCert) {
  return /^\d{17}$/.test(birthCert || '');
}

module.exports = {
  isValidEmail,
  isStrongPassword,
  isValidNid,
  isValidBirthCert,
};
