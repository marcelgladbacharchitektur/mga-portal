import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGoogleCalendarService } from '@/lib/google-calendar'

// Diese Route hilft beim Finden der korrekten Kalender-IDs
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    try {
      // Use the service to get all calendars
      const calendars = await calendarService.listCalendars()
      
      // Get detailed info for each calendar
      const discoveredCalendars = calendars.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary || false,
        hint: cal.primary ? 'Hauptkalender' : 'Zusätzlicher Kalender'
      }))
      
      return NextResponse.json({
        discoveredCalendars,
        userEmail: session.user.email,
        hint: 'Dies sind alle Kalender, auf die Sie Zugriff haben',
        success: true
      })
    } catch (error: any) {
      console.error('Error discovering calendars:', error)
      return NextResponse.json({
        error: 'Fehler beim Abrufen der Kalender',
        details: error.message,
        hint: 'Stellen Sie sicher, dass Google Calendar verbunden ist'
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('Fehler beim Entdecken der Kalender:', error)
    return NextResponse.json(
      { error: error.message || 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}