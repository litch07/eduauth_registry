const rateLimit = require('express-rate-limit');

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });
}

const isProduction = process.env.NODE_ENV === 'production';

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 5 : 100000,
  message: 'Too many login attempts, please try again later.',
});

const registrationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 3 : 50,
  message: 'Too many registrations, please try again later.',
});

const verificationLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many verification attempts, please try again later.',
});

const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});

module.exports = {
  loginLimiter,
  registrationLimiter,
  verificationLimiter,
  apiLimiter,
};
