import { NextRequest, NextResponse } from 'next/server'
import { getGoogleCalendarService } from '@/lib/google-calendar'
import { sendEmail, sendAppointmentConfirmation } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      token,
      startTime,
      endTime,
      notes
    } = body

    // Validate booking token
    if (!token) {
      return NextResponse.json(
        { error: 'Booking token is required' },
        { status: 400 }
      )
    }

    // Get booking token details
    const bookingToken = await prisma.bookingToken.findUnique({
      where: { token },
      include: { appointmentType: true }
    })

    if (!bookingToken) {
      return NextResponse.json(
        { error: 'Invalid booking token' },
        { status: 404 }
      )
    }

    if (bookingToken.used) {
      return NextResponse.json(
        { error: 'This booking link has already been used' },
        { status: 400 }
      )
    }

    if (new Date() > bookingToken.expiresAt) {
      return NextResponse.json(
        { error: 'This booking link has expired' },
        { status: 400 }
      )
    }

    // Parse dates
    const parsedStartTime = new Date(startTime)
    const parsedEndTime = new Date(endTime)
    
    // Validate dates
    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format provided' },
        { status: 400 }
      )
    }

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 503 }
      )
    }

    const eventTitle = `${bookingToken.appointmentType.name}: ${bookingToken.contactName}`
    const eventDescription = [
      `Termintyp: ${bookingToken.appointmentType.name}`,
      `Kontakt: ${bookingToken.contactName}`,
      `E-Mail: ${bookingToken.contactEmail}`,
      '',
      notes ? `Notizen: ${notes}` : ''
    ].filter(Boolean).join('\n')

    let calendarEventId = null
    
    // Try to create calendar event if Google Calendar is connected
    try {
      const calendarService = getGoogleCalendarService()
      calendarEventId = await calendarService.createEvent({
        title: eventTitle,
        description: eventDescription,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        attendees: [
          {
            email: bookingToken.contactEmail,
            name: bookingToken.contactName || bookingToken.contactEmail
          },
          {
            email: 'marcel@marcelgladbach.com',
            name: 'Marcel Gladbach'
          }
        ]
      })
      console.log('Calendar event created:', calendarEventId)
    } catch (calendarError: any) {
      console.error('Failed to create calendar event:', calendarError.message)
      // Continue without calendar event - the appointment will still be saved in the database
    }

    // Save appointment in database
    const appointment = await prisma.appointment.create({
      data: {
        id: randomUUID(),
        title: eventTitle,
        description: eventDescription,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        notes: JSON.stringify({
          calendarEventId,
          appointmentTypeId: bookingToken.appointmentTypeId,
          appointmentType: bookingToken.appointmentType.name,
          bookingToken: token
        }),
        createdById: adminUser.id,
        updatedAt: new Date()
      }
    })

    // Mark token as used
    await prisma.bookingToken.update({
      where: { id: bookingToken.id },
      data: { used: true }
    })

    // Try to send confirmation email
    try {
      await sendAppointmentConfirmation(
        bookingToken.contactEmail,
        bookingToken.contactName || bookingToken.contactEmail,
        parsedStartTime,
        bookingToken.appointmentType.name
      )
      console.log('Confirmation email sent')
    } catch (emailError: any) {
      console.error('Failed to send confirmation email:', emailError.message)
      // Continue without email - the appointment is still booked
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        title: appointment.title
      }
    })
  } catch (error: any) {
    console.error('Error booking appointment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to book appointment' },
      { status: 500 }
    )
  }
}