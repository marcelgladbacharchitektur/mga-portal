import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const appointmentTypes = await prisma.appointmentType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(appointmentTypes)
  } catch (error: any) {
    console.error('Error fetching appointment types:', error)
    
    // Return empty array if database is not available
    if (error.message?.includes('P1001') || error.message?.includes('Can\'t reach database')) {
      return NextResponse.json([])
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch appointment types' },
      { status: 500 }
    )
  }
}

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
    const { name, durationMinutes, description } = body

    if (!name || !durationMinutes) {
      return NextResponse.json(
        { error: 'Name and duration are required' },
        { status: 400 }
      )
    }

    const appointmentType = await prisma.appointmentType.create({
      data: {
        id: randomUUID(),
        name,
        durationMinutes: parseInt(durationMinutes),
        description
      }
    })

    return NextResponse.json(appointmentType)
  } catch (error: any) {
    console.error('Error creating appointment type:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create appointment type' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const { id, name, durationMinutes, description, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const appointmentType = await prisma.appointmentType.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(durationMinutes && { durationMinutes: parseInt(durationMinutes) }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(appointmentType)
  } catch (error: any) {
    console.error('Error updating appointment type:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update appointment type' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.appointmentType.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting appointment type:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete appointment type' },
      { status: 500 }
    )
  }
}