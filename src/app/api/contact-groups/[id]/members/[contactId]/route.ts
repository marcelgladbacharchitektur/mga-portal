import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Entferne die Zuordnung
    await prisma.contact.update({
      where: { id: params.contactId },
      data: { contactGroupId: null }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return Response.json(
      { error: 'Fehler beim Entfernen des Mitglieds' },
      { status: 500 }
    )
  }
}