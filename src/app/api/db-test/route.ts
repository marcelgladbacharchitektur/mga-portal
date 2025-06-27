import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test 1: Einfache Datenbankabfrage
    const userCount = await prisma.user.count()
    
    // Test 2: Kontakte zählen
    const contactCount = await prisma.contact.count()
    
    // Test 3: Kontaktgruppen zählen
    const groupCount = await prisma.contactGroup.count()
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      counts: {
        users: userCount,
        contacts: contactCount,
        contactGroups: groupCount
      }
    })
  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      meta: error.meta
    }, { status: 500 })
  }
}