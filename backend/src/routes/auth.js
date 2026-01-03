const express = require('express');
const {
  registerStudent,
  registerInstitution,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { registrationLimiter, loginLimiter } = require('../middleware/rateLimiter');
const { buildUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

const studentUpload = buildUpload({
  subfolder: 'students',
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  maxFileSize: 2 * 1024 * 1024,
});

const institutionUpload = buildUpload({
  subfolder: 'institutions',
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  maxFileSize: 1024 * 1024,
});

router.post(
  '/register/student',
  registrationLimiter,
  studentUpload.fields([
    { name: 'nidOrBirthCertImage', maxCount: 1 },
    { name: 'studentPhoto', maxCount: 1 },
  ]),
  registerStudent
);

router.post(
  '/register/institution',
  registrationLimiter,
  institutionUpload.fields([{ name: 'authoritySignature', maxCount: 1 }]),
  registerInstitution
);

router.get('/verify-email', verifyEmail);
router.post('/resend-verification', registrationLimiter, resendVerification);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', loginLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
