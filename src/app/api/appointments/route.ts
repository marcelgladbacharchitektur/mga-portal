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

    const where: any = {}

    // Zeitfilter
    if (from || to) {
      where.startTime = {}
      if (from) {
        where.startTime.gte = new Date(from)
      }
      if (to) {
        where.startTime.lte = new Date(to)
      }
    }

    // Finde alle Termine, die der Benutzer erstellt hat oder an denen er teilnimmt
    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { createdById: session.user.id },
          // TODO: Sobald wir User-Teilnahme implementieren, hier ergänzen
        ],
        ...where
      },
      include: {
        participants: true,
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return Response.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return Response.json(
      { error: 'Fehler beim Laden der Termine' },
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
      title,
      description,
      startTime,
      endTime,
      location,
      notes,
      participants
    } = data

    if (!title || !startTime || !endTime) {
      return Response.json(
        { error: 'Titel, Start- und Endzeit sind erforderlich' },
        { status: 400 }
      )
    }

    // Erstelle den Termin mit Teilnehmern
    const appointment = await prisma.appointment.create({
      data: {
        id: randomUUID(),
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || null,
        notes: notes || null,
        createdById: session.user.id,
        updatedAt: new Date(),
        participants: {
          create: participants?.map((p: any) => ({
            id: randomUUID(),
            participantType: p.participantType,
            participantId: p.participantId
          })) || []
        }
      },
      include: {
        participants: true,
      }
    })

    return Response.json(appointment)
  } catch (error) {
    console.error('Error creating appointment:', error)
    return Response.json(
      { error: 'Fehler beim Erstellen des Termins' },
      { status: 500 }
    )
  }
}