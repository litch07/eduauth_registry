const express = require('express');
const {
  dashboard,
  profile,
  searchStudents,
  enrollStudent,
  listStudents,
  getStudentDetails,
  issueCertificate,
  getCertificates,
  requestProgram,
  getPrograms,
  changePassword,
  reportIssue,
  listEnrollmentRequests,
  approveEnrollmentRequest,
  rejectEnrollmentRequest,
} = require('../controllers/institutionController');
const { requireInstitution } = require('../middleware/auth');
const { buildUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

const docsUpload = buildUpload({
  subfolder: 'institutions',
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  maxFileSize: 5 * 1024 * 1024,
});

router.use(requireInstitution);

router.get('/dashboard', dashboard);
router.get('/profile', profile);
router.get('/students/search', searchStudents);
router.post('/enroll', enrollStudent);
router.get('/students', listStudents);
router.get('/students/:id', getStudentDetails);
router.post('/certificates/issue', issueCertificate);
router.get('/certificates', getCertificates);
router.post('/programs/request', docsUpload.array('supportingDocs', 5), requestProgram);
router.get('/programs', getPrograms);
router.post('/change-password', changePassword);
router.post('/report-issue', docsUpload.array('attachments', 3), reportIssue);
router.get('/enrollment-requests', listEnrollmentRequests);
router.post('/enrollment-requests/:id/approve', approveEnrollmentRequest);
router.post('/enrollment-requests/:id/reject', rejectEnrollmentRequest);

module.exports = router;
