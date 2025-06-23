import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test basic database connection
    const taskCount = await prisma.task.count()
    
    // Try to fetch tasks with minimal fields
    const minimalTasks = await prisma.task.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true
      }
    })
    
    // Try to fetch with full fields
    const fullTasks = await prisma.task.findMany({
      take: 5,
      include: {
        Project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      count: taskCount,
      minimalTasks,
      fullTasks,
      schema: {
        taskPriority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        taskStatus: ['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED']
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}