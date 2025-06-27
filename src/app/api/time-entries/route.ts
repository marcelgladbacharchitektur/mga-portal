import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const projectId = searchParams.get('projectId')

    const where: any = {
      userId: session.user.id
    }

    // Zeitfilter
    if (from || to) {
      where.startTime = {}
      if (from) {
        where.startTime.gte = new Date(`${from}T00:00:00.000Z`)
      }
      if (to) {
        where.startTime.lte = new Date(`${to}T23:59:59.999Z`)
      }
    }

    // Projektfilter
    if (projectId) {
      where.projectId = projectId
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        },
        Task: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    return Response.json(timeEntries)
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return Response.json(
      { error: 'Fehler beim Laden der Zeiteinträge' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const data = await request.json()
    const {
      description,
      projectId,
      taskId,
      startTime,
      endTime,
      durationMinutes,
      isBillable
    } = data

    if (!description || !startTime || !durationMinutes) {
      return Response.json(
        { error: 'Beschreibung, Startzeit und Dauer sind erforderlich' },
        { status: 400 }
      )
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        id: randomUUID(),
        description,
        projectId: projectId || null,
        taskId: taskId || null,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        durationMinutes,
        isBillable,
        userId: session.user.id,
        updatedAt: new Date()
      },
      include: {
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        },
        Task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return Response.json(timeEntry)
  } catch (error) {
    console.error('Error creating time entry:', error)
    return Response.json(
      { error: 'Fehler beim Erstellen des Zeiteintrags' },
      { status: 500 }
    )
  }
}