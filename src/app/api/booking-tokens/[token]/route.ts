import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

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

    return NextResponse.json(bookingToken)
  } catch (error: any) {
    console.error('Error fetching booking token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch booking token' },
      { status: 500 }
    )
  }
}