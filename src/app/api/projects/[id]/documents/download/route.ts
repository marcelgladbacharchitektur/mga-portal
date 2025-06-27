import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getNextcloudService } from '@/lib/nextcloud';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Datei herunterladen
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
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'Dateipfad erforderlich' },
        { status: 400 }
      );
    }
    
    // Projekt abrufen
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        nextcloudPath: true
      }
    });

    if (!project || !project.nextcloudPath) {
      return NextResponse.json(
        { error: 'Projekt nicht gefunden' },
        { status: 404 }
      );
    }

    // Sicherheitsprüfung: Stelle sicher, dass die angeforderte Datei zum Projekt gehört
    if (!filePath.startsWith(project.nextcloudPath)) {
      return NextResponse.json(
        { error: 'Ungültiger Dateipfad' },
        { status: 403 }
      );
    }

    try {
      const nextcloud = getNextcloudService();
      const fileBuffer = await nextcloud.downloadFile(filePath);
      
      // Dateiname aus Pfad extrahieren
      const fileName = filePath.split('/').pop() || 'download';
      
      // MIME-Type erraten basierend auf Dateierweiterung
      const ext = fileName.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'zip': 'application/zip',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'json': 'application/json',
        'xml': 'application/xml'
      };
      
      if (ext && mimeTypes[ext]) {
        contentType = mimeTypes[ext];
      }
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
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
    console.error('Fehler beim Herunterladen der Datei:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}