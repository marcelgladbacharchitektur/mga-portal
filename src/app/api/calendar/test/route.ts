import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGoogleCalendarService } from '@/lib/google-calendar'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Test 1: Check admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { Account: true }
    })
    
    // Test 2: Check registered calendars
    const calendars = await prisma.registeredCalendar.findMany({
      where: { userId: adminUser?.id }
    })
    
    // Test 3: Try to connect to Google Calendar
    let connectionTest = { success: false, error: null as any }
    try {
      const service = getGoogleCalendarService()
      const connected = await service.testConnection()
      connectionTest.success = connected
    } catch (error: any) {
      connectionTest.error = error.message
    }
    
    // Test 4: Try to list calendars
    let calendarList = []
    try {
      const service = getGoogleCalendarService()
      calendarList = await service.listCalendars()
    } catch (error: any) {
      console.error('Calendar list error:', error)
    }
    
    return NextResponse.json({
      user: session.user,
      adminUser: {
        exists: !!adminUser,
        hasGoogleAccount: adminUser?.Account.some(a => a.provider === 'google'),
        hasTokens: !!(adminUser && adminUser.Account[0]?.access_token)
      },
      registeredCalendars: {
        count: calendars.length,
        calendars: calendars.map(c => ({ id: c.googleCalendarId, name: c.name, role: c.roleInPortal }))
      },
      connectionTest,
      googleCalendars: {
        count: calendarList.length,
        list: calendarList
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}