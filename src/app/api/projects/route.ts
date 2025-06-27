import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getNextcloudService } from '@/lib/nextcloud';
import { randomUUID } from 'crypto';

// Funktion zur Generierung der nächsten Projektnummer
async function generateProjectNumber(): Promise<string> {
  const currentYear = new Date().getFullYear().toString().slice(-2); // z.B. "24" für 2024
  
  // Finde das höchste Projekt dieses Jahres
  const lastProject = await prisma.project.findFirst({
    where: {
      projectNumber: {
        startsWith: `${currentYear}-`
      }
    },
    orderBy: {
      projectNumber: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastProject) {
    // Extrahiere die Nummer aus dem Format "YY-NNN"
    const lastNumber = parseInt(lastProject.projectNumber.split('-')[1]);
    nextNumber = lastNumber + 1;
  }

  // Formatiere die Nummer mit führenden Nullen (z.B. "001", "002", etc.)
  const formattedNumber = nextNumber.toString().padStart(3, '0');
  return `${currentYear}-${formattedNumber}`;
}

// GET: Alle Projekte abrufen
export async function GET(request: NextRequest) {
  try {
    // Überprüfe Authentifizierung
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Parse Query-Parameter
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Baue Where-Klausel basierend auf Rolle
    let whereClause: any = {};
    if (session.user.role === 'CLIENT' && session.user.contactGroupId) {
      // CLIENT sieht nur Projekte, an denen seine ContactGroup beteiligt ist
      whereClause = {
        ProjectParticipant: {
          some: {
            contactGroupId: session.user.contactGroupId
          }
        }
      };
    }

    // Füge Such-Filter hinzu
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { projectNumber: { contains: search, mode: 'insensitive' } },
        { plotAddress: { contains: search, mode: 'insensitive' } },
        { cadastralCommunity: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Füge Status-Filter hinzu
    if (status) {
      whereClause.status = status;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Fehler beim Abrufen der Projekte:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Projekte' },
      { status: 500 }
    );
  }
}

// POST: Neues Projekt erstellen
export async function POST(request: NextRequest) {
  try {
    // Überprüfe Authentifizierung
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Nur ADMIN darf neue Projekte erstellen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      budget, 
      projectType, 
      projectSector,
      parcelNumber,
      plotAddress,
      plotArea,
      cadastralCommunity,
      landRegistry,
      registrationNumber,
      zoning,
      plotNotes
    } = body;

    // Validierung
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Projektname ist erforderlich' },
        { status: 400 }
      );
    }

    // Generiere automatische Projektnummer
    const projectNumber = await generateProjectNumber();

    // Erstelle das Projekt in der Datenbank
    const project = await prisma.project.create({
      data: {
        id: randomUUID(),
        projectNumber,
        name: name.trim(),
        status: 'ACTIVE' as any,
        budget: budget || null,
        projectType: projectType || 'RESIDENTIAL',
        projectSector: projectSector || 'NEW_CONSTRUCTION',
        parcelNumber: parcelNumber || null,
        plotAddress: plotAddress || null,
        plotArea: plotArea || null,
        cadastralCommunity: cadastralCommunity || null,
        landRegistry: landRegistry || null,
        registrationNumber: registrationNumber || null,
        zoning: zoning || null,
        plotNotes: plotNotes || null,
        updatedAt: new Date(),
        lastActivityAt: new Date()
      }
    });

    // Versuche Nextcloud-Ordner zu erstellen
    try {
      const nextcloud = getNextcloudService();
      const nextcloudPath = await nextcloud.createProjectFolder(projectNumber, name.trim());
      
      // Aktualisiere das Projekt mit dem Nextcloud-Pfad
      const updatedProject = await prisma.project.update({
        where: { id: project.id },
        data: { nextcloudPath }
      });
      
      return NextResponse.json(updatedProject, { status: 201 });
    } catch (nextcloudError) {
      // Wenn Nextcloud fehlschlägt, gebe trotzdem das Projekt zurück
      // aber logge den Fehler
      console.error('Nextcloud-Ordner konnte nicht erstellt werden:', nextcloudError);
      
      // Optional: Füge eine Warnung zur Response hinzu
      return NextResponse.json({
        ...project,
        warning: 'Projekt wurde erstellt, aber Nextcloud-Ordner konnte nicht angelegt werden.'
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Fehler beim Erstellen des Projekts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Projekts' },
      { status: 500 }
    );
  }
}