import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET: Geteilten Plan abrufen
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    
    // ShareLink mit allen verknüpften Daten abrufen
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        TrackedPlan: {
          include: {
            Project: true,
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
          { error: 'Passwort erforderlich', needsPassword: true },
          { status: 401 }
        );
      }

      const isPasswordValid = await bcrypt.compare(providedPassword, shareLink.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Falsches Passwort', needsPassword: true },
          { status: 401 }
        );
      }
    }

    // Zugriffszähler erhöhen
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        accessCount: shareLink.accessCount + 1,
        lastAccessed: new Date()
      }
    });

    // Response-Daten formatieren
    const response = {
      id: shareLink.TrackedPlan.id,
      title: shareLink.TrackedPlan.title,
      description: shareLink.TrackedPlan.description,
      project: {
        name: shareLink.TrackedPlan.Project.name,
        projectNumber: shareLink.TrackedPlan.Project.projectNumber
      },
      latestVersion: shareLink.TrackedPlan.PlanVersion[0] || null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Fehler beim Abrufen des geteilten Plans:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}