import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token, appointmentTypeId, contactEmail, contactName, expiresAt } = body

    if (!token || !appointmentTypeId || !contactEmail || !expiresAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const bookingToken = await prisma.bookingToken.create({
      data: {
        token,
        appointmentTypeId,
        contactEmail,
        contactName: contactName || contactEmail,
        expiresAt: new Date(expiresAt)
      }
    })

    return NextResponse.json(bookingToken)
  } catch (error: any) {
    console.error('Error creating booking token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create booking token' },
      { status: 500 }
    )
  }
}