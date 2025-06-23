import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Alle Teilnehmer eines Projekts abrufen
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    const participants = await prisma.projectParticipant.findMany({
      where: { projectId: id },
      include: {
        ContactGroup: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(participants);
  } catch (error) {
    console.error('Fehler beim Abrufen der Teilnehmer:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// POST: Neuen Teilnehmer hinzufügen
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { contactGroupId, role } = body;

    // Validierung
    if (!contactGroupId || !role || !role.trim()) {
      return NextResponse.json(
        { error: 'ContactGroup ID und Rolle sind erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen ob Projekt existiert
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projekt nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob ContactGroup existiert
    const contactGroup = await prisma.contactGroup.findUnique({
      where: { id: contactGroupId }
    });

    if (!contactGroup) {
      return NextResponse.json(
        { error: 'Kontaktgruppe nicht gefunden' },
        { status: 404 }
      );
    }

    // Neuen Teilnehmer erstellen
    const participant = await prisma.projectParticipant.create({
      data: {
        id: randomUUID(),
        projectId,
        contactGroupId,
        role: role.trim()
      },
      include: {
        ContactGroup: true
      }
    });

    // Projekt-Aktivität aktualisieren
    await prisma.project.update({
      where: { id: projectId },
      data: {
        lastActivityAt: new Date()
      }
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Teilnehmers:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// DELETE: Teilnehmer entfernen
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json(
        { error: 'Teilnehmer ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen ob Teilnehmer existiert und zum Projekt gehört
    const participant = await prisma.projectParticipant.findFirst({
      where: {
        id: participantId,
        projectId
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Teilnehmer nicht gefunden' },
        { status: 404 }
      );
    }

    // Teilnehmer löschen
    await prisma.projectParticipant.delete({
      where: { id: participantId }
    });

    // Projekt-Aktivität aktualisieren
    await prisma.project.update({
      where: { id: projectId },
      data: {
        lastActivityAt: new Date()
      }
    });

    return NextResponse.json({ message: 'Teilnehmer erfolgreich entfernt' });
  } catch (error) {
    console.error('Fehler beim Entfernen des Teilnehmers:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}