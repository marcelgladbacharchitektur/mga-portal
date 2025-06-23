import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

// POST: Neuen Freigabe-Link erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { trackedPlanId, password, expiresAt } = body;

    // Validierung
    if (!trackedPlanId) {
      return NextResponse.json(
        { error: 'trackedPlanId ist erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen ob TrackedPlan existiert
    const trackedPlan = await prisma.trackedPlan.findUnique({
      where: { id: trackedPlanId },
      include: {
        Project: true
      }
    });

    if (!trackedPlan) {
      return NextResponse.json(
        { error: 'Plan nicht gefunden' },
        { status: 404 }
      );
    }

    // Eindeutigen Token generieren
    const token = randomBytes(32).toString('hex');

    // Passwort hashen falls vorhanden
    let hashedPassword = null;
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Ablaufdatum verarbeiten
    let expiryDate = null;
    if (expiresAt) {
      expiryDate = new Date(expiresAt);
      // Sicherstellen, dass das Datum in der Zukunft liegt
      if (expiryDate <= new Date()) {
        return NextResponse.json(
          { error: 'Ablaufdatum muss in der Zukunft liegen' },
          { status: 400 }
        );
      }
    }

    // ShareLink erstellen
    const shareLink = await prisma.shareLink.create({
      data: {
        id: randomUUID(),
        token,
        password: hashedPassword,
        expiresAt: expiryDate,
        trackedPlanId
      },
      include: {
        TrackedPlan: {
          include: {
            Project: true
          }
        }
      }
    });

    // Generiere die vollständige URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({
      ...shareLink,
      shareUrl
    }, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen des Freigabe-Links:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// GET: Alle Freigabe-Links eines Plans abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const trackedPlanId = searchParams.get('trackedPlanId');

    if (!trackedPlanId) {
      return NextResponse.json(
        { error: 'trackedPlanId ist erforderlich' },
        { status: 400 }
      );
    }

    const shareLinks = await prisma.shareLink.findMany({
      where: { trackedPlanId },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // URLs hinzufügen
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const linksWithUrls = shareLinks.map(link => ({
      ...link,
      shareUrl: `${baseUrl}/share/${link.token}`
    }));

    return NextResponse.json(linksWithUrls);
  } catch (error) {
    console.error('Fehler beim Abrufen der Freigabe-Links:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}