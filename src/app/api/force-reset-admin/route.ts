import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const adminEmail = 'admin@mga-portal.com';
    const newPassword = 'test123';
    
    // Hash das Passwort
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Versuche erst zu updaten
    const updateResult = await prisma.user.updateMany({
      where: { email: adminEmail },
      data: { 
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    if (updateResult.count === 0) {
      // Wenn kein User existiert, erstelle einen neuen
      await prisma.user.create({
        data: {
          id: randomUUID(),
          email: adminEmail,
          name: 'Admin',
          password: hashedPassword,
          role: 'ADMIN',
          updatedAt: new Date(),
        }
      });
    }

    // Verifiziere das Update
    const user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    // Teste ob das neue Passwort funktioniert
    const passwordWorks = user?.password ? await bcrypt.compare(newPassword, user.password) : false;

    return NextResponse.json({
      success: true,
      message: 'Admin-Passwort wurde zurückgesetzt',
      credentials: {
        email: adminEmail,
        password: newPassword,
        passwordWorks: passwordWorks
      },
      user: {
        exists: !!user,
        hasPassword: !!user?.password,
        role: user?.role
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Fehler beim Zurücksetzen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
}