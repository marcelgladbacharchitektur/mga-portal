import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const data = await request.json()
    const { contactIds } = data

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return Response.json({ error: 'Keine Kontakte ausgewählt' }, { status: 400 })
    }

    // Aktualisiere alle ausgewählten Kontakte
    await prisma.contact.updateMany({
      where: {
        id: { in: contactIds },
        contactGroupId: null // Nur Kontakte ohne Gruppe
      },
      data: {
        contactGroupId: params.id
      }
    })

    // Hole die aktualisierte Gruppe
    const updatedGroup = await prisma.contactGroup.findUnique({
      where: { id: params.id },
      include: { contacts: true }
    })

    return Response.json(updatedGroup)
  } catch (error) {
    console.error('Error adding members:', error)
    return Response.json(
      { error: 'Fehler beim Hinzufügen der Mitglieder' },
      { status: 500 }
    )
  }
}