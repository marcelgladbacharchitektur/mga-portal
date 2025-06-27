import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

// GET: Alle Kontaktgruppen abrufen
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // CLIENT darf keine Kontaktgruppen sehen
    if (session.user.role === 'CLIENT') {
      return NextResponse.json([]);
    }

    const contactGroups = await prisma.contactGroup.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
      include: {
        contacts: true,
        ProjectParticipant: {
          include: {
            Project: true
          }
        }
      }
    });

    return NextResponse.json(contactGroups);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kontaktgruppen:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// POST: Neue Kontaktgruppe erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Nur ADMIN darf neue Kontaktgruppen erstellen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category } = body;

    // Validierung
    if (!name || !name.trim() || !category || !category.trim()) {
      return NextResponse.json(
        { error: 'Name und Kategorie sind erforderlich' },
        { status: 400 }
      );
    }

    // Neue Kontaktgruppe erstellen
    const contactGroup = await prisma.contactGroup.create({
      data: {
        id: randomUUID(),
        name: name.trim(),
        category: category.trim(),
        updatedAt: new Date()
      },
      include: {
        contacts: true
      }
    });

    return NextResponse.json(contactGroup, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen der Kontaktgruppe:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}