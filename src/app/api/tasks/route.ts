import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/render';
import { NewTaskNotification } from '@/emails/NewTaskNotification';

// GET: Alle Aufgaben abrufen
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
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search') || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    // Füge Such-Filter hinzu
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } }
      ];
    }

    // CLIENT kann nur Aufgaben von Projekten sehen, an denen er beteiligt ist
    if (session.user.role === 'CLIENT' && session.user.contactGroupId) {
      where.Project = {
        ProjectParticipant: {
          some: {
            contactGroupId: session.user.contactGroupId
          }
        }
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Fehler beim Abrufen der Aufgaben:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// POST: Neue Aufgabe erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Nur ADMIN darf neue Aufgaben erstellen
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const body = await request.json();
    const { title, status, priority, dueDate, projectId } = body;

    // Validierung
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Titel ist erforderlich' },
        { status: 400 }
      );
    }

    // Wenn projectId angegeben, prüfen ob Projekt existiert
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Projekt nicht gefunden' },
          { status: 404 }
        );
      }
    }

    // Neue Aufgabe erstellen
    const task = await prisma.task.create({
      data: {
        id: randomUUID(),
        title: title.trim(),
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
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

    // Wenn mit Projekt verknüpft, Projekt-Aktivität aktualisieren und E-Mails versenden
    if (projectId) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          lastActivityAt: new Date()
        }
      });

      // Hole alle Projekt-Teilnehmer für E-Mail-Benachrichtigungen
      const projectWithParticipants = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          ProjectParticipant: {
            include: {
              ContactGroup: {
                include: {
                  EmailAddress: {
                    where: { isPrimary: true }
                  }
                }
              }
            }
          }
        }
      });

      if (projectWithParticipants) {
        // Sammle alle E-Mail-Adressen der Teilnehmer
        const recipientEmails = projectWithParticipants.ProjectParticipant
          .map(participant => participant.ContactGroup.EmailAddress[0]?.email)
          .filter(Boolean);

        // Sende E-Mails an alle Teilnehmer
        if (recipientEmails.length > 0) {
          try {
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const taskUrl = `${baseUrl}/tasks/${task.id}`;
            const projectUrl = `${baseUrl}/projects/${projectId}`;

            // Formatiere das Fälligkeitsdatum
            const formattedDueDate = task.dueDate 
              ? new Intl.DateTimeFormat('de-DE', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                }).format(new Date(task.dueDate))
              : undefined;

            // Erstelle die E-Mail-HTML
            const emailHtml = render(
              NewTaskNotification({
                taskTitle: task.title,
                projectName: task.Project!.name,
                projectNumber: task.Project!.projectNumber,
                createdBy: session.user.name || session.user.email || 'System',
                dueDate: formattedDueDate,
                priority: task.priority.toLowerCase(),
                taskUrl,
                projectUrl,
              })
            );

            // Sende E-Mails parallel an alle Empfänger
            await Promise.all(
              recipientEmails.map(email => 
                sendEmail({
                  to: email,
                  subject: `Neue Aufgabe: ${task.title} - ${task.Project!.name}`,
                  html: emailHtml,
                }).catch(error => {
                  console.error(`Fehler beim Senden der E-Mail an ${email}:`, error);
                })
              )
            );

            console.log(`E-Mail-Benachrichtigungen an ${recipientEmails.length} Empfänger gesendet`);
          } catch (error) {
            console.error('Fehler beim Versenden der E-Mail-Benachrichtigungen:', error);
            // Fehler beim E-Mail-Versand soll die Aufgaben-Erstellung nicht verhindern
          }
        }
      }
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen der Aufgabe:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}