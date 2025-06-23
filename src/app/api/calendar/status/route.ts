import { NextResponse } from 'next/server'
import { getGoogleCalendarService } from '@/lib/google-calendar'

// This route should be public to check calendar status
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if credentials are configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
      return NextResponse.json({ 
        connected: false,
        service: 'Google Calendar (Service Account)',
        error: 'Service account credentials not configured'
      })
    }
    
    const calendarService = getGoogleCalendarService()
    const isConnected = await calendarService.testConnection()
    
    return NextResponse.json({ 
      connected: isConnected,
      service: 'Google Calendar (Service Account)',
      calendarEmail: process.env.GOOGLE_CALENDAR_EMAIL || 'kalender@marcelgladbach.com'
    })
  } catch (error: any) {
    console.error('Calendar status check failed:', error)
    return NextResponse.json({ 
      connected: false,
      service: 'Google Calendar (Service Account)',
      error: error.message || 'Not configured'
    })
  }
}