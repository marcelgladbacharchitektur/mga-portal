import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const data = await request.json()
    const { firstName, lastName, email, phone, company, notes } = data

    if (!firstName || !lastName) {
      return Response.json(
        { error: 'Vor- und Nachname sind erforderlich' },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        company: company || null,
        notes: notes || null,
        updatedAt: new Date()
      },
      include: { contactGroup: true }
    })

    return Response.json(contact)
  } catch (error) {
    console.error('Error updating contact:', error)
    return Response.json(
      { error: 'Fehler beim Aktualisieren des Kontakts' },
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
    if (!session) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    await prisma.contact.delete({
      where: { id: params.id }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return Response.json(
      { error: 'Fehler beim Löschen des Kontakts' },
      { status: 500 }
    )
  }
}