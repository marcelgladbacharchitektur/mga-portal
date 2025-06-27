import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CalendarRole } from '@prisma/client'

// GET: Alle registrierten Kalender abrufen
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const registeredCalendars = await prisma.registeredCalendar.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(registeredCalendars)
  } catch (error) {
    console.error('Fehler beim Abrufen der registrierten Kalender:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST: Neuen Kalender registrieren
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { googleCalendarId, name, roleInPortal } = body

    if (!googleCalendarId || !name || !roleInPortal) {
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      )
    }

    // Validiere CalendarRole
    if (!Object.values(CalendarRole).includes(roleInPortal)) {
      return NextResponse.json(
        { error: 'Ungültige Kalenderrolle' },
        { status: 400 }
      )
    }

    const registeredCalendar = await prisma.registeredCalendar.create({
      data: {
        userId: session.user.id,
        googleCalendarId,
        name,
        roleInPortal
      }
    })

    return NextResponse.json(registeredCalendar, { status: 201 })
  } catch (error: any) {
    console.error('Fehler beim Registrieren des Kalenders:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Dieser Kalender ist bereits registriert' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PUT: Kalenderrolle aktualisieren
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, roleInPortal } = body

    if (!id || !roleInPortal) {
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      )
    }

    // Validiere CalendarRole
    if (!Object.values(CalendarRole).includes(roleInPortal)) {
      return NextResponse.json(
        { error: 'Ungültige Kalenderrolle' },
        { status: 400 }
      )
    }

    const updatedCalendar = await prisma.registeredCalendar.update({
      where: { 
        id,
        userId: session.user.id // Sicherheitsprüfung
      },
      data: { roleInPortal }
    })

    return NextResponse.json(updatedCalendar)
  } catch (error: any) {
    console.error('Fehler beim Aktualisieren der Kalenderrolle:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kalender nicht gefunden' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// DELETE: Kalender aus Portal entfernen
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Kalender-ID fehlt' },
        { status: 400 }
      )
    }

    await prisma.registeredCalendar.delete({
      where: { 
        id,
        userId: session.user.id // Sicherheitsprüfung
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Fehler beim Löschen des Kalenders:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kalender nicht gefunden' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}