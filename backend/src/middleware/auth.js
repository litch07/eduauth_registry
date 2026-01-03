const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

function getToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

function authenticateToken(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

async function requireApprovedUser(req, res, next) {
  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ message: 'Authorization token required' });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== 'APPROVED') {
    return res.status(403).json({ message: 'Account is not approved' });
  }
  req.userRecord = user;
  return next();
}

function requireStudent(req, res, next) {
  authenticateToken(req, res, async () => {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Student access required' });
    }
    return requireApprovedUser(req, res, next);
  });
}

function requireInstitution(req, res, next) {
  authenticateToken(req, res, async () => {
    if (req.user.role !== 'INSTITUTION') {
      return res.status(403).json({ message: 'Institution access required' });
    }
    return requireApprovedUser(req, res, next);
  });
}

function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    return next();
  });
}

module.exports = {
  authenticateToken,
  requireStudent,
  requireInstitution,
  requireAdmin,
};
