import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getNextcloudService } from '@/lib/nextcloud';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET: PDF-Datei herunterladen
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    
    // ShareLink mit allen verknüpften Daten abrufen
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        TrackedPlan: {
          include: {
            PlanVersion: {
              orderBy: {
                versionNumber: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Freigabe-Link' },
        { status: 404 }
      );
    }

    // Prüfen ob Link abgelaufen ist
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Dieser Freigabe-Link ist abgelaufen' },
        { status: 410 }
      );
    }

    // Prüfen ob Passwort erforderlich ist
    if (shareLink.password) {
      const providedPassword = request.headers.get('X-Share-Password');
      
      if (!providedPassword) {
        return NextResponse.json(
          { error: 'Passwort erforderlich' },
          { status: 401 }
        );
      }

      const isPasswordValid = await bcrypt.compare(providedPassword, shareLink.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Falsches Passwort' },
          { status: 401 }
        );
      }
    }

    // Prüfen ob eine Version existiert
    const latestVersion = shareLink.TrackedPlan.PlanVersion[0];
    if (!latestVersion) {
      return NextResponse.json(
        { error: 'Keine Version verfügbar' },
        { status: 404 }
      );
    }

    try {
      // Datei von Nextcloud abrufen
      const nextcloud = getNextcloudService();
      const fileContent = await nextcloud.downloadFile(latestVersion.filePath);
      
      // Response mit PDF-Datei
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${shareLink.TrackedPlan.title}_v${latestVersion.versionNumber}.pdf"`,
          'Content-Length': fileContent.length.toString(),
        },
      });
    } catch (nextcloudError) {
      console.error('Fehler beim Abrufen der Datei von Nextcloud:', nextcloudError);
      return NextResponse.json(
        { error: 'Datei konnte nicht heruntergeladen werden' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fehler beim Download:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}