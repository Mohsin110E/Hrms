import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'Admin@123';
  const userTypeId = parseInt(process.argv[4] || '3', 10);

  const normalizedUsername = username.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { username: normalizedUsername } });
  if (existing) {
    console.log(`User ${normalizedUsername} already exists`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const profile = await prisma.profile.create({
    data: { name: 'Admin', email: 'admin@example.com', isSiteAccess: true },
  });

  const user = await prisma.user.create({
    data: {
      username: normalizedUsername,
      passwordHash,
      userTypeId,
      profileId: profile.id,
      isActive: true,
      mustChangePassword: false,
    },
  });

  console.log(`Created user ${user.username} (id=${user.id}, profileId=${profile.id})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
