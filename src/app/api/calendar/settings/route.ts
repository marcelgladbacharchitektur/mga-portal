import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoogleCalendarService } from '@/lib/google-calendar'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Get current calendar settings
    const settings = await prisma.calendarSettings.findUnique({
      where: { userId: session.user.id }
    })

    // Return parsed working hours if they exist
    const response = settings ? {
      ...settings,
      workingHours: settings.workingHours || {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      }
    } : null

    // Get list of available calendars
    try {
      const calendarService = getGoogleCalendarService()
      await calendarService.initialize()
      const calendars = await calendarService.listCalendars()
      
      return NextResponse.json({
        ...response,
        availableCalendars: calendars
      })
    } catch (error: any) {
      console.error('Fehler beim Abrufen der Kalenderliste:', error)
      // If calendar service fails, return settings only
      return NextResponse.json({
        ...response,
        availableCalendars: [],
        error: error.message || 'Google Calendar nicht verbunden'
      })
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Kalender-Einstellungen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { blockerCalendarId, infoCalendarIds } = body

    // Upsert calendar settings
    const settings = await prisma.calendarSettings.upsert({
      where: { userId: session.user.id },
      update: {
        blockerCalendarId,
        infoCalendarIds: infoCalendarIds || []
      },
      create: {
        userId: session.user.id,
        blockerCalendarId,
        infoCalendarIds: infoCalendarIds || []
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Fehler beim Speichern der Kalender-Einstellungen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { workingHours, bufferMinutes } = body

    // Validate working hours structure
    if (workingHours && typeof workingHours === 'object') {
      const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      for (const day of requiredDays) {
        if (!Array.isArray(workingHours[day])) {
          return NextResponse.json(
            { error: `Invalid working hours format for ${day}` },
            { status: 400 }
          )
        }
      }
    }

    // Upsert calendar settings with working hours
    const settings = await prisma.calendarSettings.upsert({
      where: { userId: session.user.id },
      update: {
        workingHours: workingHours || undefined,
        bufferMinutes: bufferMinutes || undefined,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        workingHours: workingHours || {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        },
        bufferMinutes: bufferMinutes || 30
      }
    })

    return NextResponse.json({
      ...settings,
      workingHours: settings.workingHours || {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      }
    })
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Arbeitszeiten:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}