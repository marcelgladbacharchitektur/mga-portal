import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    try {
      // Google Calendar Service holt sich automatisch die aktuellen Tokens
      const calendarService = getGoogleCalendarService()
      
      // Kalenderliste abrufen
      const calendars = await calendarService.listCalendars()
      
      // Bereinigte Liste zurückgeben
      const simplifiedCalendars = calendars.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary || false
      }))
      
      return NextResponse.json({ 
        calendars: simplifiedCalendars,
        success: true 
      })
      
    } catch (calendarError: any) {
      console.error('Google Calendar Fehler:', calendarError)
      
      // Detaillierte Fehlerbehandlung
      if (calendarError.message?.includes('invalid_grant')) {
        return NextResponse.json({
          error: 'Google Calendar Autorisierung abgelaufen',
          calendars: []
        }, { status: 401 })
      }
      
      if (calendarError.message?.includes('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS')) {
        return NextResponse.json({
          error: 'Google Calendar nicht konfiguriert',
          calendars: []
        }, { status: 503 })
      }
      
      // Allgemeiner Fehler
      return NextResponse.json({
        error: 'Fehler beim Abrufen der Kalenderliste',
        calendars: [],
        details: calendarError.message
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Kalenderliste:', error)
    return NextResponse.json(
      { 
        error: 'Interner Serverfehler',
        calendars: [] 
      },
      { status: 500 }
    )
  }
}