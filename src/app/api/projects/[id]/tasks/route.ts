import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: params.id },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return Response.json(tasks)
  } catch (error) {
    console.error('Error fetching project tasks:', error)
    return Response.json(
      { error: 'Fehler beim Laden der Aufgaben' },
      { status: 500 }
    )
  }
}