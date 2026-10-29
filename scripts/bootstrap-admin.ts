import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2] ?? 'admin';
  const password = process.argv[3] ?? 'Admin@123';
  const userTypeId = 3; // SystemAdmin

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`User ${username} already exists (id=${existing.id})`);
    await prisma.$disconnect();
    return;
  }

  const profile = await prisma.profile.create({
    data: {
      name: 'System',
      lastName: 'Admin',
      email: `${username}@localhost`,
      isSiteAccess: true,
    },
  });

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: hash,
      userTypeId,
      profileId: profile.id,
      isActive: true,
    },
  });

  console.log(`Created admin user: id=${user.id}, username=${username}, profileId=${profile.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
