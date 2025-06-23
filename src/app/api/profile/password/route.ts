import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validierung
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Aktuelles und neues Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      );
    }

    // Benutzer mit Passwort abrufen
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Aktuelles Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Das aktuelle Passwort ist nicht korrekt' },
        { status: 401 }
      );
    }

    // Neues Passwort hashen
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Passwort aktualisieren
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Passwort erfolgreich geändert'
    });
  } catch (error) {
    console.error('Fehler beim Ändern des Passworts:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}