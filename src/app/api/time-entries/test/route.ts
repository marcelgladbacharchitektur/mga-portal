import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Test database connection
    const count = await prisma.timeEntry.count()
    
    // Try to fetch time entries
    const entries = await prisma.timeEntry.findMany({
      where: { userId: session.user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        },
        Task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      count,
      entriesFound: entries.length,
      sampleEntry: entries[0] || null
    })
  } catch (error: any) {
    console.error('Time entries test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}