import { prisma } from '@/lib/prisma'

export interface LocalEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  userId: string
  createdAt: Date
  updatedAt: Date
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
}

export class LocalCalendarService {
  async getEvents(startDate: Date, endDate: Date, userId: string): Promise<LocalEvent[]> {
    const events = await prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })
    
    return events
  }
  
  async createEvent(eventData: EventData, userId: string): Promise<string> {
    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        location: eventData.location,
        userId
      }
    })
    
    return event.id
  }
  
  async updateEvent(eventId: string, eventData: Partial<EventData>, userId: string): Promise<void> {
    await prisma.event.update({
      where: {
        id: eventId,
        userId
      },
      data: {
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        location: eventData.location
      }
    })
  }
  
  async deleteEvent(eventId: string, userId: string): Promise<void> {
    await prisma.event.delete({
      where: {
        id: eventId,
        userId
      }
    })
  }
  
  async getAvailableSlots(date: Date, durationMinutes: number = 90, userId: string): Promise<TimeSlot[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(9, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(18, 0, 0, 0)
    
    // Get existing events for the day
    const events = await prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })
    
    const slots: TimeSlot[] = []
    const slotInterval = 30 // minutes
    let currentSlot = new Date(startOfDay)
    
    while (currentSlot < endOfDay) {
      const slotEnd = new Date(currentSlot)
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes)
      
      // Check if slot conflicts with existing events
      const isAvailable = !events.some(event => {
        return (currentSlot < event.endTime && slotEnd > event.startTime)
      })
      
      if (slotEnd <= endOfDay && isAvailable) {
        slots.push({
          start: new Date(currentSlot),
          end: new Date(slotEnd),
          available: true
        })
      }
      
      currentSlot.setMinutes(currentSlot.getMinutes() + slotInterval)
    }
    
    return slots
  }
}

export const localCalendar = new LocalCalendarService()