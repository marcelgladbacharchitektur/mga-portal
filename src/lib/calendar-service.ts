import { GoogleCalendarService } from './google-calendar'
import { LocalCalendarService } from './local-calendar'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date | string
  end: Date | string
  location?: string
  calendarId?: string
  source: 'google' | 'local'
}

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}

export interface EventData {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  attendees?: { email: string; name?: string }[]
  calendarId?: string
}

class CalendarService {
  private googleCalendar = new GoogleCalendarService()
  private localCalendar = new LocalCalendarService()
  
  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error('Not authenticated')
    }
    
    const events: CalendarEvent[] = []
    
    // Try to get Google Calendar events if configured
    try {
      await this.googleCalendar.initialize()
      const googleEvents = await this.googleCalendar.getEvents(startDate, endDate)
      
      events.push(...googleEvents.map(event => ({
        id: event.id || '',
        title: event.summary || '',
        description: event.description,
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        location: event.location,
        calendarId: 'primary',
        source: 'google' as const
      })))
    } catch (error) {
      console.log('Google Calendar not available, using local calendar only')
    }
    
    // Always get local events
    const localEvents = await this.localCalendar.getEvents(startDate, endDate, session.user.id)
    events.push(...localEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.startTime,
      end: event.endTime,
      location: event.location,
      calendarId: 'local',
      source: 'local' as const
    })))
    
    // Sort by start time
    return events.sort((a, b) => {
      const startA = new Date(a.start).getTime()
      const startB = new Date(b.start).getTime()
      return startA - startB
    })
  }
  
  async createEvent(eventData: EventData): Promise<string> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error('Not authenticated')
    }
    
    // If Google Calendar is configured and requested, use it
    if (eventData.calendarId && eventData.calendarId !== 'local') {
      try {
        await this.googleCalendar.initialize()
        return await this.googleCalendar.createEvent(eventData)
      } catch (error) {
        console.error('Failed to create Google event, falling back to local:', error)
      }
    }
    
    // Otherwise use local calendar
    return await this.localCalendar.createEvent(eventData, session.user.id)
  }
  
  async updateEvent(eventId: string, eventData: Partial<EventData>, source: 'google' | 'local'): Promise<void> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error('Not authenticated')
    }
    
    if (source === 'google') {
      throw new Error('Google Calendar update not implemented yet')
    }
    
    await this.localCalendar.updateEvent(eventId, eventData, session.user.id)
  }
  
  async deleteEvent(eventId: string, source: 'google' | 'local'): Promise<void> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error('Not authenticated')
    }
    
    if (source === 'google') {
      throw new Error('Google Calendar delete not implemented yet')
    }
    
    await this.localCalendar.deleteEvent(eventId, session.user.id)
  }
  
  async getAvailableSlots(date: Date, durationMinutes: number = 90): Promise<TimeSlot[]> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error('Not authenticated')
    }
    
    // Try Google Calendar first if available
    try {
      await this.googleCalendar.initialize()
      return await this.googleCalendar.getAvailableSlots(date, durationMinutes)
    } catch (error) {
      console.log('Using local calendar for available slots')
    }
    
    // Fall back to local calendar
    return await this.localCalendar.getAvailableSlots(date, durationMinutes, session.user.id)
  }
  
  async listCalendars(): Promise<{ id: string; name: string; color?: string; source: 'google' | 'local' }[]> {
    const calendars: { id: string; name: string; color?: string; source: 'google' | 'local' }[] = [
      { id: 'local', name: 'Lokaler Kalender', color: '#3B82F6', source: 'local' }
    ]
    
    // Try to get Google calendars if available
    try {
      await this.googleCalendar.initialize()
      const googleCalendars = await this.googleCalendar.listCalendars()
      calendars.push(...googleCalendars.map(cal => ({
        id: cal.id || 'primary',
        name: cal.summary || 'Google Kalender',
        color: cal.backgroundColor,
        source: 'google' as const
      })))
    } catch (error) {
      console.log('Google Calendar not available')
    }
    
    return calendars
  }
}

export const calendarService = new CalendarService()