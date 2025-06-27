import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Suche Admin-User
    const user = await prisma.user.findUnique({
      where: { email: 'admin@mga-portal.com' }
    });

    if (!user) {
      return NextResponse.json({
        error: 'User nicht gefunden',
        userExists: false
      });
    }

    // Teste verschiedene Passwörter
    const testPasswords = [
      'Admin123!',
      'MGA-Admin-2024!',
      'admin',
      'password'
    ];

    const results = await Promise.all(
      testPasswords.map(async (pwd) => {
        const isValid = user.password ? await bcrypt.compare(pwd, user.password) : false;
        return { password: pwd, isValid };
      })
    );

    // Erstelle ein neues gehashtes Passwort zum Vergleich
    const newHashedPassword = await bcrypt.hash('Admin123!', 10);

    return NextResponse.json({
      userExists: true,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
      testResults: results,
      newHashExample: newHashedPassword,
      currentHash: user.password ? user.password.substring(0, 20) + '...' : null
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Fehler beim Testen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
}