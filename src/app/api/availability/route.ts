import { NextRequest, NextResponse } from 'next/server'
import { getGoogleCalendarService, WorkingHours, TimeSlot } from '@/lib/google-calendar'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface GranularTimeSlot {
  start: string
  end: string
}

interface GranularWorkingHours {
  monday: GranularTimeSlot[]
  tuesday: GranularTimeSlot[]
  wednesday: GranularTimeSlot[]
  thursday: GranularTimeSlot[]
  friday: GranularTimeSlot[]
  saturday: GranularTimeSlot[]
  sunday: GranularTimeSlot[]
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

// Convert granular working hours to time slots for a specific date
function getTimeSlotsForDate(
  date: Date,
  granularHours: GranularWorkingHours,
  slotDurationMinutes: number,
  bufferMinutes: number,
  slotInterval: number = 15
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const dayName = DAY_NAMES[date.getDay()]
  const daySlots = granularHours[dayName] || []
  
  for (const timeRange of daySlots) {
    const [startHour, startMinute] = timeRange.start.split(':').map(Number)
    const [endHour, endMinute] = timeRange.end.split(':').map(Number)
    
    const rangeStart = new Date(date)
    rangeStart.setHours(startHour, startMinute, 0, 0)
    
    const rangeEnd = new Date(date)
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
      
      // Move to next slot by slot interval (15 minutes)
      slotStart = new Date(slotStart)
      slotStart.setMinutes(slotStart.getMinutes() + slotInterval)
    }
  }
  
  return slots
}

// Generate demo slots when Google Calendar is not connected
function generateDemoSlots(
  startDate: Date,
  endDate: Date,
  slotDurationMinutes: number,
  granularHours: GranularWorkingHours,
  bufferMinutes: number,
  slotInterval: number = 15
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const daySlots = getTimeSlotsForDate(current, granularHours, slotDurationMinutes, bufferMinutes, slotInterval)
    
    // Make some slots unavailable for demo purposes
    daySlots.forEach(slot => {
      const hour = slot.start.getHours()
      const minute = slot.start.getMinutes()
      slot.available = !(
        (hour === 10 && minute === 30) || // 10:30 slot busy
        (hour === 14 && minute === 0) ||   // 14:00 slot busy
        (hour === 15 && minute === 30)     // 15:30 slot busy
      )
    })
    
    slots.push(...daySlots)
    
    // Move to next day
    current.setDate(current.getDate() + 1)
  }

  return slots
}

export async function GET(request: NextRequest) {
  console.log('=== Availability API Called ===')
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const durationMinutes = parseInt(searchParams.get('duration') || '60')
    const appointmentTypeId = searchParams.get('appointmentTypeId')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      )
    }

    // Get appointment type duration if specified
    let slotDuration = durationMinutes
    if (appointmentTypeId) {
      const appointmentType = await prisma.appointmentType.findUnique({
        where: { id: appointmentTypeId }
      })
      if (appointmentType) {
        slotDuration = appointmentType.durationMinutes
      }
    }

    // Get admin user (service will handle token refresh automatically)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 503 }
      )
    }

    // Get all BLOCKING calendars for the admin user
    const blockingCalendars = await prisma.registeredCalendar.findMany({
      where: { 
        userId: adminUser.id,
        roleInPortal: 'BLOCKING'
      }
    })
    let blockingCalendarIds = blockingCalendars.map(cal => cal.googleCalendarId)
    
    // Fallback auf Default-Kalender wenn keine Blocker definiert
    if (blockingCalendarIds.length === 0) {
      blockingCalendarIds = ['primary']
    }

    // Get working hours from database
    const calendarSettings = await prisma.calendarSettings.findUnique({
      where: { userId: adminUser.id }
    })

    // Use granular working hours if available, otherwise use defaults
    let granularWorkingHours: GranularWorkingHours
    let bufferMinutes = 15  // Buffer between appointments
    let slotInterval = 15   // Show slots every 15 minutes
    
    if (calendarSettings?.workingHours) {
      granularWorkingHours = calendarSettings.workingHours as GranularWorkingHours
      bufferMinutes = calendarSettings.bufferMinutes || 15  // Buffer after each appointment
    } else {
      // Default working hours (9-12, 13-18 Mon-Fri)
      granularWorkingHours = {
        monday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }],
        wednesday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }],
        thursday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }],
        friday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
        saturday: [],
        sunday: []
      }
    }

    // Convert to old WorkingHours format for Google Calendar service
    // TODO: Update Google Calendar service to use granular hours
    const workingHours: WorkingHours = {
      startHour: 9,
      endHour: 18,
      bufferMinutes: bufferMinutes,  // Use the actual buffer for blocking time after appointments
      workDays: [1, 2, 3, 4, 5] // Monday to Friday
    }

    // Check if Google Calendar is properly configured
    try {
      const calendarService = getGoogleCalendarService()
      
      console.log('=== Availability API Debug ===')
      console.log('Start Date:', startDate)
      console.log('End Date:', endDate)
      console.log('Slot Duration:', slotDuration)
      console.log('Blocking Calendar IDs:', blockingCalendarIds)
      console.log('Working Hours:', workingHours)
      console.log('Granular Working Hours:', granularWorkingHours)
      
      // Parse dates properly to avoid timezone issues
      const start = new Date(startDate + 'T00:00:00')
      const end = new Date(endDate + 'T23:59:59')
      
      // Get available slots for the primary calendar first
      console.log('Getting available slots for primary calendar...')
      console.log('Parsed Start:', start.toISOString())
      console.log('Parsed End:', end.toISOString())
      
      const primarySlots = await calendarService.getAvailableSlots(
        start,
        end,
        slotDuration,
        workingHours,
        'primary',
        granularWorkingHours
      )
      console.log(`Found ${primarySlots.length} total slots for primary calendar`)
      
      // If there are additional blocking calendars, check them too
      if (blockingCalendarIds.length > 0 && !blockingCalendarIds.includes('primary')) {
        for (const calId of blockingCalendarIds) {
          console.log(`Checking blocking calendar: ${calId}`)
          try {
            const calSlots = await calendarService.getAvailableSlots(
              start,
              end,
              slotDuration,
              workingHours,
              calId,
              granularWorkingHours
            )
            // Merge busy times (TODO: proper implementation)
            console.log(`Found ${calSlots.length} slots for calendar ${calId}`)
          } catch (calError: any) {
            console.error(`Error checking calendar ${calId}:`, calError.message)
            // Continue with other calendars even if one fails
          }
        }
      }
      
      // For now, return the primary calendar slots
      const availableSlots = primarySlots.filter(slot => slot.available)
      console.log(`Returning ${availableSlots.length} available slots`)
      
      return NextResponse.json({ slots: availableSlots })
    } catch (calendarError: any) {
      console.error('=== Google Calendar Connection Error ===')
      console.error('Error:', calendarError.message)
      
      // Return demo slots when Google Calendar is not connected
      console.log('Returning demo slots as fallback')
      const demoSlots = generateDemoSlots(
        start,
        end,
        slotDuration,
        granularWorkingHours,
        bufferMinutes,
        slotInterval
      )
      
      return NextResponse.json({ 
        slots: demoSlots,
        warning: 'Google Calendar nicht verbunden. Demo-Termine werden angezeigt.'
      })
    }
  } catch (error: any) {
    console.error('=== Final Error Handler ===')
    console.error('Error fetching availability:', error)
    console.error('Stack Trace:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch availability',
        code: error.code,
        details: error.errors
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { start, end, buffer } = await request.json()
    
    // Save working hours configuration
    // TODO: Implement saving working hours to database
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving working hours:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save working hours' },
      { status: 500 }
    )
  }
}