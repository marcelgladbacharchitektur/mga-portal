import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Einzelne Aufgabe abrufen
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
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Aufgabe nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Fehler beim Abrufen der Aufgabe:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// PUT: Aufgabe aktualisieren
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, status, priority, dueDate, projectId } = body;

    // Prüfen ob Aufgabe existiert
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Aufgabe nicht gefunden' },
        { status: 404 }
      );
    }

    // Aufgabe aktualisieren
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title?.trim() || existingTask.title,
        status: status || existingTask.status,
        priority: priority || existingTask.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingTask.dueDate,
        projectId: projectId !== undefined ? projectId : existingTask.projectId,
        updatedAt: new Date()
      },
      include: {
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        }
      }
    });

    // Projekt-Aktivität aktualisieren wenn zugeordnet
    if (updatedTask.projectId) {
      await prisma.project.update({
        where: { id: updatedTask.projectId },
        data: {
          lastActivityAt: new Date()
        }
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Aufgabe:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// DELETE: Aufgabe löschen
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
    
    // Prüfen ob Aufgabe existiert
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Aufgabe nicht gefunden' },
        { status: 404 }
      );
    }

    // Aufgabe löschen
    await prisma.task.delete({
      where: { id }
    });

    // Projekt-Aktivität aktualisieren wenn zugeordnet
    if (existingTask.projectId) {
      await prisma.project.update({
        where: { id: existingTask.projectId },
        data: {
          lastActivityAt: new Date()
        }
      });
    }

    return NextResponse.json({ message: 'Aufgabe erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Aufgabe:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}