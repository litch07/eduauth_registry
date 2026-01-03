const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const institutionRoutes = require('./routes/institution');
const adminRoutes = require('./routes/admin');
const verificationRoutes = require('./routes/verification');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadsRoot = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', '..', 'uploads'));
app.use('/uploads', express.static(uploadsRoot));

app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/institution', institutionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verify', verificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
