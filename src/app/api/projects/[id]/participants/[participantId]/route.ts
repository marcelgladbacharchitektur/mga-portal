import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; participantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Lösche den Teilnehmer
    await prisma.projectParticipant.delete({
      where: { id: params.participantId }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error removing participant:', error)
    return Response.json(
      { error: 'Fehler beim Entfernen des Teilnehmers' },
      { status: 500 }
    )
  }
}