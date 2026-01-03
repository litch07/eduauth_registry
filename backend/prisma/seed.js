const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'eduauthregistry@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'admin';
  const name = process.env.ADMIN_NAME || 'System Administrator';

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: { password: hashedPassword, name },
    create: { email, password: hashedPassword, name },
  });

  console.log(`Admin user ensured: ${email}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
