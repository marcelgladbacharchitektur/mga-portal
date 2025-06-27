import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Einzelne Kontaktgruppe abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const contactGroup = await prisma.contactGroup.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        ProjectParticipant: {
          include: {
            Project: true
          }
        }
      }
    });

    if (!contactGroup) {
      return NextResponse.json(
        { error: 'Kontaktgruppe nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(contactGroup);
  } catch (error) {
    console.error('Fehler beim Abrufen der Kontaktgruppe:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// PUT: Kontaktgruppe aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
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

    // Prüfen ob Kontaktgruppe existiert
    const existing = await prisma.contactGroup.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Kontaktgruppe nicht gefunden' },
        { status: 404 }
      );
    }

    // Kontaktgruppe aktualisieren
    const contactGroup = await prisma.contactGroup.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        category: category.trim(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(contactGroup);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Kontaktgruppe:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// DELETE: Kontaktgruppe löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Prüfen ob Kontaktgruppe existiert
    const existing = await prisma.contactGroup.findUnique({
      where: { id: params.id },
      include: {
        ProjectParticipant: true
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Kontaktgruppe nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob Kontaktgruppe in Projekten verwendet wird
    if (existing.ProjectParticipant.length > 0) {
      return NextResponse.json(
        { error: 'Kontaktgruppe kann nicht gelöscht werden, da sie in Projekten verwendet wird' },
        { status: 400 }
      );
    }

    // Kontaktgruppe löschen
    await prisma.contactGroup.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Kontaktgruppe:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}