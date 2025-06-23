import { google, calendar_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from './prisma'

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
  private userId: string | null = null

  constructor() {
    // Initialize OAuth2 client with client credentials from environment
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    this.calendarId = 'primary'
  }

  /**
   * Get authenticated OAuth2 client with fresh tokens
   * This is the core function that ensures we always have valid tokens
   */
  private async getAuthenticatedClient(): Promise<OAuth2Client> {
    // Check if we have a service account key configured
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    
    if (serviceAccountKey) {
      console.log('Using Service Account authentication')
      try {
        // Parse the service account key
        const serviceAccount = JSON.parse(serviceAccountKey)
        
        // Create auth client from service account
        const auth = new google.auth.GoogleAuth({
          credentials: serviceAccount,
          scopes: ['https://www.googleapis.com/auth/calendar']
        })
        
        // Get authenticated client
        const authClient = await auth.getClient() as OAuth2Client
        return authClient
      } catch (error) {
        console.error('Error parsing service account key:', error)
        console.log('Falling back to OAuth2 authentication')
      }
    }
    
    console.log('Using OAuth2 authentication')
    // Get admin user with tokens
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: {
        Account: {
          where: { provider: 'google' }
        }
      }
    })

    if (!adminUser || adminUser.Account.length === 0) {
      throw new Error('Admin user has not connected Google Calendar')
    }

    const googleAccount = adminUser.Account[0]
    this.userId = adminUser.id

    // Set current tokens
    this.oauth2Client.setCredentials({
      access_token: googleAccount.access_token,
      refresh_token: googleAccount.refresh_token,
      expiry_date: googleAccount.expires_at ? googleAccount.expires_at * 1000 : undefined
    })

    // Check if token is expired or will expire in next 5 minutes
    const now = Date.now()
    const expiryTime = googleAccount.expires_at ? googleAccount.expires_at * 1000 : 0
    const isExpired = expiryTime <= now + (5 * 60 * 1000) // 5 minutes buffer

    if (isExpired && googleAccount.refresh_token) {
      console.log('Access token expired or expiring soon, refreshing...')
      
      try {
        // Refresh the access token
        const { credentials } = await this.oauth2Client.refreshAccessToken()
        
        // Update tokens in database
        await prisma.account.update({
          where: { id: googleAccount.id },
          data: {
            access_token: credentials.access_token,
            expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
            token_type: credentials.token_type,
            scope: credentials.scope
          }
        })

        // Also update user's OAuth fields for backward compatibility
        await prisma.user.update({
          where: { id: adminUser.id },
          data: {
            googleAccessToken: credentials.access_token,
            googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
          }
        })

        console.log('Access token refreshed successfully')
        
        // Set the new credentials
        this.oauth2Client.setCredentials(credentials)
      } catch (error) {
        console.error('Failed to refresh access token:', error)
        throw new Error('Failed to refresh Google Calendar access token. Please reconnect your Google account.')
      }
    }

    return this.oauth2Client
  }

  async testConnection(): Promise<boolean> {
    try {
      const auth = await this.getAuthenticatedClient()
      const calendar = google.calendar({ version: 'v3', auth })
      const response = await calendar.calendars.get({ calendarId: this.calendarId })
      console.log('Connected to calendar:', response.data.summary)
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
    calendarId?: string,
    granularWorkingHours?: any
  ): Promise<TimeSlot[]> {
    await this.getAuthenticatedClient()

    // Get busy times from Google Calendar
    const busyTimes = await this.getBusyTimes(startDate, endDate, calendarId)

    // Generate all possible slots based on working hours
    const allSlots = granularWorkingHours 
      ? this.generateGranularWorkingHourSlots(
          startDate,
          endDate,
          slotDurationMinutes,
          workingHours.bufferMinutes,
          granularWorkingHours
        )
      : this.generateWorkingHourSlots(
          startDate,
          endDate,
          slotDurationMinutes,
          workingHours
        )

    // Mark slots as unavailable if they overlap with busy times (including buffer)
    const availableSlots = allSlots.map(slot => {
      const isAvailable = !busyTimes.some(busy => {
        // Add buffer time to the busy period
        const busyStart = new Date(busy.start!)
        const busyEndWithBuffer = new Date(busy.end!)
        busyEndWithBuffer.setMinutes(busyEndWithBuffer.getMinutes() + workingHours.bufferMinutes)
        
        return this.timesOverlap(slot.start, slot.end, busyStart.toISOString(), busyEndWithBuffer.toISOString())
      })
      return { ...slot, available: isAvailable }
    })

    return availableSlots
  }

  private async getBusyTimes(startDate: Date, endDate: Date, calendarId?: string): Promise<calendar_v3.Schema$TimePeriod[]> {
    const auth = await this.getAuthenticatedClient()
    const calendar = google.calendar({ version: 'v3', auth })
    
    const targetCalendarId = calendarId || this.calendarId
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: targetCalendarId }]
      }
    })

    return response.data.calendars?.[targetCalendarId]?.busy || []
  }

  private generateGranularWorkingHourSlots(
    startDate: Date,
    endDate: Date,
    slotDurationMinutes: number,
    bufferMinutes: number,
    granularWorkingHours: any
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    const current = new Date(startDate)
    const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

    while (current < endDate) {
      const dayName = DAY_NAMES[current.getDay()]
      const daySlots = granularWorkingHours[dayName] || []
      
      for (const timeRange of daySlots) {
        const [startHour, startMinute] = timeRange.start.split(':').map(Number)
        const [endHour, endMinute] = timeRange.end.split(':').map(Number)
        
        const rangeStart = new Date(current)
        rangeStart.setHours(startHour, startMinute, 0, 0)
        
        const rangeEnd = new Date(current)
        rangeEnd.setHours(endHour, endMinute, 0, 0)
        
        let slotStart = new Date(rangeStart)
        
        while (slotStart < rangeEnd) {
          const slotEnd = new Date(slotStart)
          slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes)
          
          // Only add slot if it ends before range end and is in the future
          if (slotEnd <= rangeEnd && slotStart > new Date()) {
            slots.push({
              start: new Date(slotStart),
              end: new Date(slotEnd),
              available: true
            })
          }
          
          // Move to next slot by 15-minute interval
          slotStart = new Date(slotStart)
          slotStart.setMinutes(slotStart.getMinutes() + 15) // Always use 15-minute intervals
        }
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1)
    }

    return slots
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
        
        // Round to nearest 15-minute interval
        const minutes = dayStart.getMinutes()
        const roundedMinutes = Math.ceil(minutes / 15) * 15
        dayStart.setMinutes(roundedMinutes)
        
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
          
          // Move to next slot by 15-minute interval
          slotStart = new Date(slotStart)
          slotStart.setMinutes(slotStart.getMinutes() + 15) // Always use 15-minute intervals
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
    const auth = await this.getAuthenticatedClient()
    const calendar = google.calendar({ version: 'v3', auth })

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

    const response = await calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: event,
      sendUpdates: 'all' // Send email invitations to attendees
    })

    return response.data.id || ''
  }

  async updateEvent(eventId: string, eventData: Partial<EventData>): Promise<void> {
    const auth = await this.getAuthenticatedClient()
    const calendar = google.calendar({ version: 'v3', auth })

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

    await calendar.events.patch({
      calendarId: this.calendarId,
      eventId: eventId,
      requestBody: updateData,
      sendUpdates: 'all'
    })
  }

  async deleteEvent(eventId: string): Promise<void> {
    const auth = await this.getAuthenticatedClient()
    const calendar = google.calendar({ version: 'v3', auth })

    await calendar.events.delete({
      calendarId: this.calendarId,
      eventId: eventId,
      sendUpdates: 'all'
    })
  }

  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event | null> {
    try {
      const auth = await this.getAuthenticatedClient()
      const calendar = google.calendar({ version: 'v3', auth })
      
      const response = await calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId
      })
      return response.data
    } catch (error) {
      return null
    }
  }

  async listCalendars(): Promise<{ id: string; summary: string; primary?: boolean }[]> {
    try {
      const auth = await this.getAuthenticatedClient()
      const calendar = google.calendar({ version: 'v3', auth })
      
      const response = await calendar.calendarList.list({
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
    const auth = await this.getAuthenticatedClient()
    const calendar = google.calendar({ version: 'v3', auth })

    const allEvents: any[] = []

    for (const calendarId of calendarIds) {
      try {
        const response = await calendar.events.list({
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
    const auth = await this.getAuthenticatedClient()
    const calendar = google.calendar({ version: 'v3', auth })

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

// Singleton instance with automatic token refresh
let calendarService: GoogleCalendarService | null = null

/**
 * Get the singleton instance of GoogleCalendarService
 * This version automatically handles token refresh
 */
export function getGoogleCalendarService(): GoogleCalendarService {
  if (!calendarService) {
    calendarService = new GoogleCalendarService()
  }
  return calendarService
}

/**
 * Create a new instance of GoogleCalendarService
 * Use this when you need a fresh instance
 */
export function createGoogleCalendarService(): GoogleCalendarService {
  return new GoogleCalendarService()
}