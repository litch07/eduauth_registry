const express = require('express');
const {
  adminLogin,
  dashboard,
  listStudents,
  listCertificates,
  pendingStudents,
  approveStudent,
  rejectStudent,
  pendingInstitutions,
  approveInstitution,
  rejectInstitution,
  pendingProfileChanges,
  approveProfileChange,
  rejectProfileChange,
  pendingPrograms,
  approveProgram,
  rejectProgram,
  listInstitutions,
  revokePermission,
  grantPermission,
  revokeProgram,
  activityLogs,
  listReports,
  updateReport,
  respondReport,
} = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', adminLogin);

router.use(requireAdmin);

router.get('/dashboard', dashboard);
router.get('/students', listStudents);
router.get('/certificates', listCertificates);
router.get('/pending/students', pendingStudents);
router.post('/pending/students/:id/approve', approveStudent);
router.post('/pending/students/:id/reject', rejectStudent);
router.get('/pending/institutions', pendingInstitutions);
router.post('/pending/institutions/:id/approve', approveInstitution);
router.post('/pending/institutions/:id/reject', rejectInstitution);
router.get('/pending/profile-changes', pendingProfileChanges);
router.post('/pending/profile-changes/:id/approve', approveProfileChange);
router.post('/pending/profile-changes/:id/reject', rejectProfileChange);
router.get('/pending/programs', pendingPrograms);
router.post('/pending/programs/:id/approve', approveProgram);
router.post('/pending/programs/:id/reject', rejectProgram);
router.get('/institutions', listInstitutions);
router.put('/institutions/:id/revoke-permission', revokePermission);
router.put('/institutions/:id/grant-permission', grantPermission);
router.put('/institutions/:id/programs/:programId/revoke', revokeProgram);
router.get('/activity-logs', activityLogs);
router.get('/reports', listReports);
router.put('/reports/:id', updateReport);
router.post('/reports/:id/respond', respondReport);

module.exports = router;
