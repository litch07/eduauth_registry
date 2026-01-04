const { execute } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

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
  const id = uuidv4();
  const serializedDetails = details ? JSON.stringify(details) : null;
  await execute(
    `INSERT INTO ActivityLog
      (id, actorId, actorType, actorName, action, targetType, targetId, details, ipAddress, institutionId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      id,
      actorId || null,
      actorType,
      actorName,
      action,
      targetType || null,
      targetId || null,
      serializedDetails,
      ipAddress || null,
      institutionId || null,
    ]
  );

  return { id };
}

module.exports = { logActivity };
