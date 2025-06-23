import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, durationMinutes, description, isActive } = body

    const appointmentType = await prisma.appointmentType.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(durationMinutes && { durationMinutes: parseInt(durationMinutes) }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(appointmentType)
  } catch (error: any) {
    console.error('Fehler beim Aktualisieren des Termintyps:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Termintyp nicht gefunden' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Soft delete - nur isActive auf false setzen
    await prisma.appointmentType.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Fehler beim Löschen des Termintyps:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Termintyp nicht gefunden' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}