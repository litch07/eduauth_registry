const express = require('express');
const {
  dashboard,
  profile,
  updatePhoto,
  updatePhone,
  requestProfileUpdate,
  getProfileRequests,
  getCertificates,
  toggleCertificateSharing,
  changePassword,
  reportIssue,
  searchInstitutions,
  createEnrollmentRequest,
  listEnrollmentRequests,
  cancelEnrollmentRequest,
} = require('../controllers/studentController');
const { requireStudent } = require('../middleware/auth');
const { buildUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

const photoUpload = buildUpload({
  subfolder: 'students',
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  maxFileSize: 512000,
});

const docsUpload = buildUpload({
  subfolder: 'students',
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  maxFileSize: 2 * 1024 * 1024,
});

router.use(requireStudent);

router.get('/dashboard', dashboard);
router.get('/profile', profile);
router.put('/profile/photo', photoUpload.single('studentPhoto'), updatePhoto);
router.put('/profile/phone', updatePhone);
router.post('/profile/request-update', docsUpload.array('supportingDocs', 3), requestProfileUpdate);
router.get('/profile/requests', getProfileRequests);
router.get('/certificates', getCertificates);
router.put('/certificates/:id/sharing', toggleCertificateSharing);
router.post('/change-password', changePassword);
router.post('/report-issue', docsUpload.array('attachments', 3), reportIssue);
router.get('/institutions/search', searchInstitutions);
router.post('/enrollment-requests', docsUpload.array('supportingDocs', 3), createEnrollmentRequest);
router.get('/enrollment-requests', listEnrollmentRequests);
router.delete('/enrollment-requests/:id', cancelEnrollmentRequest);

module.exports = router;
