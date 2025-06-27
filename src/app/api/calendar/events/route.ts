import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGoogleCalendarService } from '@/lib/google-calendar'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') || 'month'
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString())
    const allCalendars = searchParams.get('allCalendars') === 'true'

    // Calculate date range based on view
    let timeMin: Date
    let timeMax: Date

    if (view === 'today') {
      // Get only today's events
      const now = new Date()
      timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    } else if (view === 'month') {
      // Get first and last day of the month
      timeMin = new Date(year, month, 1)
      timeMax = new Date(year, month + 1, 0, 23, 59, 59)
    } else if (view === 'week') {
      // Get current week
      const now = new Date()
      const dayOfWeek = now.getDay()
      const firstDayOfWeek = new Date(now)
      firstDayOfWeek.setDate(now.getDate() - dayOfWeek)
      firstDayOfWeek.setHours(0, 0, 0, 0)
      
      const lastDayOfWeek = new Date(firstDayOfWeek)
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6)
      lastDayOfWeek.setHours(23, 59, 59, 999)
      
      timeMin = firstDayOfWeek
      timeMax = lastDayOfWeek
    } else {
      // Default to current month
      timeMin = new Date(year, month, 1)
      timeMax = new Date(year, month + 1, 0, 23, 59, 59)
    }

    try {
      console.log('Fetching calendar events for:', { view, year, month, allCalendars })
      
      const calendarService = getGoogleCalendarService()
      
      // Get admin user's registered calendars
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true }
      })
      
      if (!adminUser) {
        console.error('No admin user found')
        return NextResponse.json({ 
          events: [],
          error: 'Admin user not found'
        })
      }
      
      // Get all registered calendars for the admin user
      const registeredCalendars = await prisma.registeredCalendar.findMany({
        where: { userId: adminUser.id }
      })
      
      console.log('Found registered calendars:', registeredCalendars.length)
      
      // Create a map for quick lookup of calendar roles
      const calendarRoleMap = new Map(
        registeredCalendars.map(cal => [cal.googleCalendarId, cal.roleInPortal])
      )
      
      // Create calendar info map for colors
      const calendarInfoMap = new Map(
        registeredCalendars.map(cal => [cal.googleCalendarId, {
          name: cal.name,
          role: cal.roleInPortal,
          color: cal.roleInPortal === 'BLOCKING' ? '#EF4444' : '#3B82F6' // Red for blocking, blue for info
        }])
      )
      
      // Get all calendar IDs
      let calendarIds = registeredCalendars.map(cal => cal.googleCalendarId)
      
      // If no calendars registered, use primary as fallback
      if (calendarIds.length === 0) {
        console.log('No calendars registered, using primary calendar')
        calendarIds = ['primary']
      }
      
      // Get events from all configured calendars
      const allEvents = await calendarService.getEventsFromMultipleCalendars(
        calendarIds,
        timeMin,
        timeMax
      )
      
      console.log(`Found ${allEvents.length} events from ${calendarIds.length} calendars`)
      
      // Transform Google Calendar events to our format
      const transformedEvents = allEvents.map(event => {
        const startDate = new Date(event.start?.dateTime || event.start?.date)
        const endDate = new Date(event.end?.dateTime || event.end?.date)
        const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
        const calendarInfo = calendarInfoMap.get(event.calendarId) || { 
          name: event.calendarSummary || 'Unknown Calendar',
          color: '#6B7280'
        }
        
        return {
          id: event.id,
          title: event.summary || 'Kein Titel',
          description: event.description,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          // Add formatted time strings for frontend
          startTime: event.start?.dateTime ? format(startDate, 'HH:mm') : 'Ganztägig',
          endTime: event.end?.dateTime ? format(endDate, 'HH:mm') : '',
          duration: durationMinutes,
          location: event.location,
          attendees: event.attendees?.map((a: any) => ({
            email: a.email,
            name: a.displayName,
            responseStatus: a.responseStatus
          })),
          isAllDay: !event.start?.dateTime,
          creator: event.creator?.email,
          status: event.status,
          calendarId: event.calendarId,
          calendarName: calendarInfo.name,
          calendarColor: calendarInfo.color,
          isBlocker: calendarRoleMap.get(event.calendarId) === 'BLOCKING'
        }
      })

      return NextResponse.json({ 
        events: transformedEvents,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString()
      })
    } catch (calendarError: any) {
      console.error('Google Calendar error:', calendarError)
      
      // More detailed error message
      const errorMessage = calendarError.message || 'Google Calendar nicht verbunden'
      
      // Return empty events array if calendar is not connected
      return NextResponse.json({ 
        events: [],
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? calendarError.toString() : undefined
      })
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Termine:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}