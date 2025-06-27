import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getNextcloudService } from '@/lib/nextcloud';
import { randomUUID } from 'crypto';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Alle Versionen eines Plans abrufen
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { id: trackedPlanId } = await params;
    
    const versions = await prisma.planVersion.findMany({
      where: { trackedPlanId },
      orderBy: {
        versionNumber: 'desc'
      }
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Fehler beim Abrufen der Versionen:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// POST: Neue Version hochladen
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { id: trackedPlanId } = await params;
    
    // FormData verarbeiten
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Bitte laden Sie eine PDF-Datei hoch' },
        { status: 400 }
      );
    }

    // Plan mit Projekt-Info abrufen
    const trackedPlan = await prisma.trackedPlan.findUnique({
      where: { id: trackedPlanId },
      include: {
        Project: true,
        PlanVersion: {
          orderBy: {
            versionNumber: 'desc'
          },
          take: 1
        }
      }
    });

    if (!trackedPlan) {
      return NextResponse.json(
        { error: 'Plan nicht gefunden' },
        { status: 404 }
      );
    }

    // Nächste Versionsnummer bestimmen
    const nextVersionNumber = trackedPlan.PlanVersion.length > 0 
      ? trackedPlan.PlanVersion[0].versionNumber + 1 
      : 1;

    // Datei zu Nextcloud hochladen
    try {
      const nextcloud = getNextcloudService();
      
      // Zielverzeichnis erstellen falls nicht vorhanden
      const planFolderPath = `${trackedPlan.Project.nextcloudPath}/02_Pläne/${trackedPlan.title.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
      
      // Dateiname mit Versionsnummer
      const fileName = `v${nextVersionNumber}_${file.name}`;
      const filePath = `${planFolderPath}/${fileName}`;
      
      // Datei in Buffer konvertieren
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Datei hochladen
      await nextcloud.uploadFile(filePath, buffer);
      
      // Version in Datenbank speichern
      const version = await prisma.planVersion.create({
        data: {
          id: randomUUID(),
          versionNumber: nextVersionNumber,
          filePath,
          description: description?.trim() || null,
          fileSize: file.size,
          uploadedBy: session.user.email,
          trackedPlanId
        }
      });

      // TrackedPlan updatedAt aktualisieren
      const updatedPlan = await prisma.trackedPlan.update({
        where: { id: trackedPlanId },
        data: { updatedAt: new Date() },
        include: { Project: true }
      });

      // Projekt-Aktivität aktualisieren
      await prisma.project.update({
        where: { id: updatedPlan.Project.id },
        data: {
          lastActivityAt: new Date()
        }
      });

      return NextResponse.json(version, { status: 201 });
    } catch (nextcloudError) {
      console.error('Fehler beim Hochladen zu Nextcloud:', nextcloudError);
      return NextResponse.json(
        { error: 'Datei konnte nicht hochgeladen werden' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fehler beim Erstellen der Version:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}