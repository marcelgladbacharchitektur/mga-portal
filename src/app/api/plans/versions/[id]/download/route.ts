import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getNextcloudService } from '@/lib/nextcloud';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Version herunterladen
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { id: versionId } = await params;
    
    // Version mit Plan abrufen
    const version = await prisma.planVersion.findUnique({
      where: { id: versionId },
      include: {
        TrackedPlan: {
          include: {
            Project: true
          }
        }
      }
    });

    if (!version) {
      return NextResponse.json(
        { error: 'Version nicht gefunden' },
        { status: 404 }
      );
    }

    try {
      const nextcloud = getNextcloudService();
      const fileBuffer = await nextcloud.downloadFile(version.filePath);
      
      // Dateiname aus Pfad extrahieren
      const fileName = version.filePath.split('/').pop() || 'download.pdf';
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`
        }
      });
    } catch (nextcloudError) {
      console.error('Fehler beim Herunterladen der Datei:', nextcloudError);
      return NextResponse.json(
        { error: 'Datei konnte nicht heruntergeladen werden' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fehler beim Herunterladen der Version:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}