import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@mga-portal.com';
  const temporaryPassword = 'MGA-Admin-2024!';
  
  // Hash das Passwort
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  // Erstelle Admin-User
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
    },
    create: {
      id: randomUUID(),
      email: adminEmail,
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      updatedAt: new Date(),
    },
  });

  console.log('=================================');
  console.log('Admin-User erstellt:');
  console.log('E-Mail:', adminEmail);
  console.log('Temporäres Passwort:', temporaryPassword);
  console.log('=================================');
  console.log('WICHTIG: Bitte ändern Sie das Passwort nach dem ersten Login!');
  console.log('=================================');

  return admin;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });