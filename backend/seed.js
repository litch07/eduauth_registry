require('dotenv').config();

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, execute, pool } = require('./src/config/database');

async function main() {
  const email = process.env.ADMIN_EMAIL || 'eduauthregistry@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'admin';
  const name = process.env.ADMIN_NAME || 'System Administrator';

  const hashedPassword = await bcrypt.hash(password, 12);

  const existing = await query('SELECT id FROM Admins WHERE email = ? LIMIT 1', [email]);
  if (existing.length) {
    await execute('UPDATE Admins SET password = ?, name = ?, updatedAt = NOW() WHERE id = ?', [
      hashedPassword,
      name,
      existing[0].id,
    ]);
    console.log(`Admin user updated: ${email}`);
    return;
  }

  const adminId = uuidv4();
  await execute(
    'INSERT INTO Admins (id, email, password, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [adminId, email, hashedPassword, name]
  );
  console.log(`Admin user created: ${email}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
