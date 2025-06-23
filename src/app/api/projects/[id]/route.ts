import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Einzelnes Projekt abrufen
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
    
    // Baue Where-Klausel basierend auf Rolle
    let whereClause: any = { id };
    if (session.user.role === 'CLIENT' && session.user.contactGroupId) {
      // CLIENT sieht nur Projekte, an denen seine ContactGroup beteiligt ist
      whereClause.ProjectParticipant = {
        some: {
          contactGroupId: session.user.contactGroupId
        }
      };
    }
    
    const project = await prisma.project.findFirst({
      where: whereClause,
      include: {
        Task: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          }
        },
        ProjectParticipant: {
          include: {
            ContactGroup: true
          }
        },
        TrackedPlan: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projekt nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Fehler beim Abrufen des Projekts:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// PUT: Projekt aktualisieren
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Nur ADMIN darf Projekte bearbeiten
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      name, 
      status, 
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
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Projektname ist erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen ob Projekt existiert
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Projekt nicht gefunden' },
        { status: 404 }
      );
    }

    // Projekt aktualisieren
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name.trim(),
        status: status || existingProject.status,
        budget: budget !== undefined ? budget : existingProject.budget,
        projectType: projectType || existingProject.projectType,
        projectSector: projectSector || existingProject.projectSector,
        parcelNumber: parcelNumber !== undefined ? parcelNumber : existingProject.parcelNumber,
        plotAddress: plotAddress !== undefined ? plotAddress : existingProject.plotAddress,
        plotArea: plotArea !== undefined ? plotArea : existingProject.plotArea,
        cadastralCommunity: cadastralCommunity !== undefined ? cadastralCommunity : existingProject.cadastralCommunity,
        landRegistry: landRegistry !== undefined ? landRegistry : existingProject.landRegistry,
        registrationNumber: registrationNumber !== undefined ? registrationNumber : existingProject.registrationNumber,
        zoning: zoning !== undefined ? zoning : existingProject.zoning,
        plotNotes: plotNotes !== undefined ? plotNotes : existingProject.plotNotes,
        updatedAt: new Date(),
        lastActivityAt: new Date()
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Projekts:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// DELETE: Projekt löschen
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Prüfen ob Projekt existiert
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Projekt nicht gefunden' },
        { status: 404 }
      );
    }

    // Projekt löschen
    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Projekt erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Projekts:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}