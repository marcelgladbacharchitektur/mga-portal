import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { google } from 'googleapis'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Create auth client
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
    if (!credentialsJson) {
      throw new Error('Google Calendar nicht konfiguriert')
    }
    
    const credentials = JSON.parse(credentialsJson)
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly' // Erlaubt das Lesen der Kalenderliste
      ]
    })
    
    const calendar = google.calendar({ version: 'v3', auth })
    
    // Check existing calendars
    const existingCalendars = await calendar.calendarList.list()
    const calendars = existingCalendars.data.items || []
    
    const blockerExists = calendars.some(cal => 
      cal.summary?.includes('MGA Blocker') || cal.summary?.includes('Gebuchte Termine')
    )
    const infoExists = calendars.some(cal => 
      cal.summary?.includes('MGA Info') || cal.summary?.includes('Deadlines')
    )
    
    const created = []
    
    // Create Blocker Calendar if not exists
    if (!blockerExists) {
      try {
        const blockerCalendar = await calendar.calendars.insert({
          requestBody: {
            summary: 'MGA Blocker & Gebuchte Termine',
            description: 'Termine in diesem Kalender blockieren die Verfügbarkeit für Kundenbuchungen',
            timeZone: 'Europe/Vienna'
          }
        })
        created.push({
          id: blockerCalendar.data.id,
          summary: blockerCalendar.data.summary,
          type: 'blocker'
        })
      } catch (error) {
        console.error('Error creating blocker calendar:', error)
      }
    }
    
    // Create Info Calendar if not exists
    if (!infoExists) {
      try {
        const infoCalendar = await calendar.calendars.insert({
          requestBody: {
            summary: 'MGA Info & Deadlines',
            description: 'Informative Termine und Deadlines - blockieren keine Kundenbuchungen',
            timeZone: 'Europe/Vienna'
          }
        })
        created.push({
          id: infoCalendar.data.id,
          summary: infoCalendar.data.summary,
          type: 'info'
        })
      } catch (error) {
        console.error('Error creating info calendar:', error)
      }
    }
    
    return NextResponse.json({
      created,
      message: created.length > 0 
        ? `${created.length} Kalender wurden erstellt` 
        : 'Alle empfohlenen Kalender existieren bereits'
    })
  } catch (error) {
    console.error('Fehler beim Erstellen der Standard-Kalender:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Kalender' },
      { status: 500 }
    )
  }
}