import { google, calendar_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

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
}

export interface WorkingHours {
  startHour: number
  endHour: number
  bufferMinutes: number
  workDays: number[] // 0 = Sunday, 1 = Monday, etc.
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client
  private calendar: calendar_v3.Calendar
  private calendarId: string
  private accessToken: string | null = null

  constructor() {
    // Initialize OAuth2 client with client credentials from environment
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    this.calendarId = process.env.GOOGLE_CALENDAR_EMAIL || 'primary'
  }

  /**
   * Set the OAuth2 access token for API requests
   * @param accessToken The OAuth2 access token obtained from the authentication flow
   */
  setAccessToken(accessToken: string) {
    this.accessToken = accessToken
    this.oauth2Client.setCredentials({
      access_token: accessToken
    })
  }

  /**
   * Set the OAuth2 credentials including access and refresh tokens
   * @param credentials The OAuth2 credentials object
   */
  setCredentials(credentials: { access_token: string; refresh_token?: string; expiry_date?: number }) {
    this.oauth2Client.setCredentials(credentials)
    this.accessToken = credentials.access_token
  }

  /**
   * Check if the service has a valid access token
   */
  hasValidToken(): boolean {
    const credentials = this.oauth2Client.credentials
    if (!credentials || !credentials.access_token) {
      return false
    }

    // Check if token is expired
    if (credentials.expiry_date && credentials.expiry_date <= Date.now()) {
      return false
    }

    return true
  }

  /**
   * Ensure the service has a valid token before making API calls
   */
  private ensureAuthenticated() {
    if (!this.hasValidToken()) {
      throw new Error('No valid OAuth2 access token. Please authenticate first.')
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      this.ensureAuthenticated()
      const calendar = await this.calendar.calendars.get({ calendarId: this.calendarId })
      console.log('Connected to calendar:', calendar.data.summary)
      return true
    } catch (error) {
      console.error('Calendar connection test failed:', error)
      return false
    }
  }

  async getAvailableSlots(
    startDate: Date,
    endDate: Date,
    slotDurationMinutes: number,
    workingHours: WorkingHours,
    calendarId?: string
  ): Promise<TimeSlot[]> {
    this.ensureAuthenticated()

    // Get busy times from Google Calendar
    const busyTimes = await this.getBusyTimes(startDate, endDate, calendarId)

    // Generate all possible slots based on working hours
    const allSlots = this.generateWorkingHourSlots(
      startDate,
      endDate,
      slotDurationMinutes,
      workingHours
    )

    // Mark slots as unavailable if they overlap with busy times
    const availableSlots = allSlots.map(slot => {
      const isAvailable = !busyTimes.some(busy => 
        this.timesOverlap(slot.start, slot.end, busy.start!, busy.end!)
      )
      return { ...slot, available: isAvailable }
    })

    return availableSlots
  }

  private async getBusyTimes(startDate: Date, endDate: Date, calendarId?: string): Promise<calendar_v3.Schema$TimePeriod[]> {
    const targetCalendarId = calendarId || this.calendarId
    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: targetCalendarId }]
      }
    })

    return response.data.calendars?.[targetCalendarId]?.busy || []
  }

  private generateWorkingHourSlots(
    startDate: Date,
    endDate: Date,
    slotDurationMinutes: number,
    workingHours: WorkingHours
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    const current = new Date(startDate)

    while (current < endDate) {
      const dayOfWeek = current.getDay()
      
      // Check if this is a working day
      if (workingHours.workDays.includes(dayOfWeek)) {
        const dayStart = new Date(current)
        dayStart.setHours(workingHours.startHour, 0, 0, 0)
        
        const dayEnd = new Date(current)
        dayEnd.setHours(workingHours.endHour, 0, 0, 0)

        let slotStart = new Date(dayStart)
        
        while (slotStart < dayEnd) {
          const slotEnd = new Date(slotStart)
          slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes)
          
          // Only add slot if it ends before working hours end and is in the future
          if (slotEnd <= dayEnd && slotStart > new Date()) {
            slots.push({
              start: new Date(slotStart),
              end: new Date(slotEnd),
              available: true
            })
          }
          
          // Move to next slot with buffer time
          slotStart = new Date(slotEnd)
          slotStart.setMinutes(slotStart.getMinutes() + workingHours.bufferMinutes)
        }
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1)
    }

    return slots
  }

  private timesOverlap(start1: Date, end1: Date, start2: string, end2: string): boolean {
    const s2 = new Date(start2)
    const e2 = new Date(end2)
    return start1 < e2 && end1 > s2
  }

  async createEvent(eventData: EventData): Promise<string> {
    this.ensureAuthenticated()

    const event: calendar_v3.Schema$Event = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'Europe/Vienna'
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'Europe/Vienna'
      },
      attendees: eventData.attendees?.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name
      })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 } // 1 hour before
        ]
      }
    }

    const response = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: event,
      sendUpdates: 'all' // Send email invitations to attendees
    })

    return response.data.id || ''
  }

  async updateEvent(eventId: string, eventData: Partial<EventData>): Promise<void> {
    this.ensureAuthenticated()

    const updateData: calendar_v3.Schema$Event = {}

    if (eventData.title) updateData.summary = eventData.title
    if (eventData.description) updateData.description = eventData.description
    if (eventData.location) updateData.location = eventData.location
    
    if (eventData.startTime) {
      updateData.start = {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'Europe/Vienna'
      }
    }
    
    if (eventData.endTime) {
      updateData.end = {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'Europe/Vienna'
      }
    }

    if (eventData.attendees) {
      updateData.attendees = eventData.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name
      }))
    }

    await this.calendar.events.patch({
      calendarId: this.calendarId,
      eventId: eventId,
      requestBody: updateData,
      sendUpdates: 'all'
    })
  }

  async deleteEvent(eventId: string): Promise<void> {
    this.ensureAuthenticated()

    await this.calendar.events.delete({
      calendarId: this.calendarId,
      eventId: eventId,
      sendUpdates: 'all'
    })
  }

  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event | null> {
    this.ensureAuthenticated()

    try {
      const response = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId
      })
      return response.data
    } catch (error) {
      return null
    }
  }

  async listCalendars(): Promise<{ id: string; summary: string; primary?: boolean }[]> {
    this.ensureAuthenticated()

    try {
      const response = await this.calendar.calendarList.list({
        minAccessRole: 'writer'
      })

      const calendars = response.data.items || []
      return calendars.map(cal => ({
        id: cal.id || '',
        summary: cal.summary || 'Unnamed Calendar',
        primary: cal.primary || false
      }))
    } catch (error) {
      console.error('Error in listCalendars:', error)
      return []
    }
  }

  async getEventsFromMultipleCalendars(
    calendarIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    this.ensureAuthenticated()

    const allEvents: any[] = []

    for (const calendarId of calendarIds) {
      try {
        const response = await this.calendar.events.list({
          calendarId,
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 100
        })

        const events = response.data.items || []
        
        // Add calendar info to each event
        const eventsWithCalendar = events.map(event => ({
          ...event,
          calendarId,
          calendarSummary: response.data.summary
        }))

        allEvents.push(...eventsWithCalendar)
      } catch (error) {
        console.error(`Error fetching events from calendar ${calendarId}:`, error)
      }
    }

    return allEvents
  }

  async getAvailableSlotsMultiCalendar(
    startDate: Date,
    endDate: Date,
    slotDurationMinutes: number,
    workingHours: WorkingHours,
    calendarIds: string[]
  ): Promise<TimeSlot[]> {
    this.ensureAuthenticated()

    // Sammle alle busy times von allen Blocking-Kalendern
    const allBusyTimes: calendar_v3.Schema$TimePeriod[] = []
    
    for (const calendarId of calendarIds) {
      try {
        const busyTimes = await this.getBusyTimes(startDate, endDate, calendarId)
        allBusyTimes.push(...busyTimes)
      } catch (error) {
        console.error(`Error getting busy times for calendar ${calendarId}:`, error)
      }
    }

    // Generate all possible slots based on working hours
    const allSlots = this.generateWorkingHourSlots(
      startDate,
      endDate,
      slotDurationMinutes,
      workingHours
    )

    // Mark slots as unavailable if they overlap with any busy time
    const availableSlots = allSlots.map(slot => {
      const isAvailable = !allBusyTimes.some(busy => 
        this.timesOverlap(slot.start, slot.end, busy.start!, busy.end!)
      )
      return { ...slot, available: isAvailable }
    })

    return availableSlots
  }
}

// Singleton instance
let calendarService: GoogleCalendarService | null = null

/**
 * Get the singleton instance of GoogleCalendarService
 * Note: You must call setAccessToken() or setCredentials() before using the service
 */
export function getGoogleCalendarService(): GoogleCalendarService {
  if (!calendarService) {
    calendarService = new GoogleCalendarService()
  }
  return calendarService
}

/**
 * Create a new instance of GoogleCalendarService with OAuth2 credentials
 * This is useful when you need to use different credentials for different users
 */
export function createGoogleCalendarService(credentials: { 
  access_token: string; 
  refresh_token?: string; 
  expiry_date?: number 
}): GoogleCalendarService {
  const service = new GoogleCalendarService()
  service.setCredentials(credentials)
  return service
}