import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Alle Pläne eines Projekts abrufen
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    
    const plans = await prisma.trackedPlan.findMany({
      where: { projectId },
      include: {
        PlanVersion: {
          orderBy: {
            versionNumber: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Fehler beim Abrufen der Pläne:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// POST: Neuen Plan erstellen
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
    const { title, description } = body;

    // Validierung
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Titel ist erforderlich' },
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

    // Plan erstellen
    const plan = await prisma.trackedPlan.create({
      data: {
        id: randomUUID(),
        title: title.trim(),
        description: description?.trim() || null,
        projectId,
        updatedAt: new Date()
      },
      include: {
        PlanVersion: true
      }
    });

    // Projekt-Aktivität aktualisieren
    await prisma.project.update({
      where: { id: projectId },
      data: {
        lastActivityAt: new Date()
      }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen des Plans:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}