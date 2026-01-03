const prisma = require('../config/database');

async function logActivity({
  actorId,
  actorType,
  actorName,
  action,
  targetType,
  targetId,
  details,
  ipAddress,
  institutionId,
}) {
  return prisma.activityLog.create({
    data: {
      actorId,
      actorType,
      actorName,
      action,
      targetType,
      targetId,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
      institutionId,
    },
  });
}

module.exports = { logActivity };
