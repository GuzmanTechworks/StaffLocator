import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const administratorPassword = await bcrypt.hash('0ffice.IT', 10);
  const userPassword = await bcrypt.hash('0000004457', 10);

  await prisma.user.upsert({
    where: { username: 'isd.admin' },
    update: { firstName: 'ISD', lastName: 'Administrator', password: administratorPassword, isAdmin: true },
    create: { firstName: 'ISD', lastName: 'Administrator', username: 'isd.admin', password: administratorPassword, isAdmin: true },
  });

  await prisma.user.upsert({
    where: { username: '0000004457' },
    update: { firstName: 'Staff', lastName: 'Member', password: userPassword, isAdmin: false },
    create: { firstName: 'Staff', lastName: 'Member', username: '0000004457', password: userPassword, isAdmin: false },
  });

  for (const name of ['Main Office', 'Finance', 'Human Resources', 'IT Help Desk']) {
    await prisma.location.upsert({ where: { name }, update: {}, create: { name } });
  }
}

main().finally(() => prisma.$disconnect());
