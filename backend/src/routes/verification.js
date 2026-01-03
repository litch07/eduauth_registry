const express = require('express');
const { verifyCertificate, stats } = require('../controllers/verificationController');
const { verificationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/certificate', verificationLimiter, verifyCertificate);
router.get('/stats', stats);

module.exports = router;
