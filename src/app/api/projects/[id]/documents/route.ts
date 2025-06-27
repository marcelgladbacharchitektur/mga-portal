import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getNextcloudService } from '@/lib/nextcloud';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Dokumente eines Projekts abrufen
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
    
    // Projekt abrufen
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        nextcloudPath: true,
        name: true,
        projectNumber: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projekt nicht gefunden' },
        { status: 404 }
      );
    }

    if (!project.nextcloudPath) {
      return NextResponse.json({ documents: [], folders: [] });
    }

    try {
      const nextcloud = getNextcloudService();
      const contents = await nextcloud.listFolder(project.nextcloudPath);
      
      // Trenne Dateien und Ordner
      const folders = contents
        .filter(item => item.type === 'directory')
        .sort((a, b) => a.name.localeCompare(b.name));
        
      const files = contents
        .filter(item => item.type === 'file')
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

      return NextResponse.json({
        projectPath: project.nextcloudPath,
        folders,
        files
      });
    } catch (nextcloudError) {
      console.error('Fehler beim Abrufen der Nextcloud-Dokumente:', nextcloudError);
      return NextResponse.json({ 
        documents: [], 
        folders: [],
        error: 'Nextcloud-Verbindung fehlgeschlagen' 
      });
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Dokumente:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// GET: Inhalt eines Unterordners abrufen
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { folderPath } = body;

    if (!folderPath) {
      return NextResponse.json(
        { error: 'Ordnerpfad erforderlich' },
        { status: 400 }
      );
    }
    
    // Sicherheitsprüfung: Stelle sicher, dass der angeforderte Pfad zum Projekt gehört
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

    // Prüfe, ob der angeforderte Pfad mit dem Projektpfad beginnt
    if (!folderPath.startsWith(project.nextcloudPath)) {
      return NextResponse.json(
        { error: 'Ungültiger Ordnerpfad' },
        { status: 403 }
      );
    }

    try {
      const nextcloud = getNextcloudService();
      const contents = await nextcloud.listFolder(folderPath);
      
      // Trenne Dateien und Ordner
      const folders = contents
        .filter(item => item.type === 'directory')
        .sort((a, b) => a.name.localeCompare(b.name));
        
      const files = contents
        .filter(item => item.type === 'file')
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

      return NextResponse.json({
        currentPath: folderPath,
        folders,
        files
      });
    } catch (nextcloudError) {
      console.error('Fehler beim Abrufen des Ordnerinhalts:', nextcloudError);
      return NextResponse.json({ 
        folders: [],
        files: [],
        error: 'Nextcloud-Verbindung fehlgeschlagen' 
      });
    }
  } catch (error) {
    console.error('Fehler beim Abrufen des Ordnerinhalts:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}