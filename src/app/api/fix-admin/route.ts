import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const adminEmail = 'admin@mga-portal.com';
    const newPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Lösche existierenden Admin-User falls vorhanden
    await prisma.user.deleteMany({
      where: { email: adminEmail }
    });
    
    // Erstelle neuen Admin-User
    const admin = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: adminEmail,
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
        updatedAt: new Date(),
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Admin-User wurde neu erstellt',
      credentials: {
        email: adminEmail,
        password: newPassword,
        role: 'ADMIN'
      }
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Admin-Users:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen des Admin-Users',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}