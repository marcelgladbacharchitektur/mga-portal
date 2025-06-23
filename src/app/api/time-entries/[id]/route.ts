import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe ob der Zeiteintrag dem Benutzer gehört
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!timeEntry) {
      return Response.json({ error: 'Zeiteintrag nicht gefunden' }, { status: 404 })
    }

    await prisma.timeEntry.delete({
      where: { id: params.id }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return Response.json(
      { error: 'Fehler beim Löschen des Zeiteintrags' },
      { status: 500 }
    )
  }
}