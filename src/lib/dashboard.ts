import { prisma } from '@/lib/prisma';
import { ProjectStatus, TaskStatus, TaskPriority } from '@prisma/client';

export interface FocusPoint {
  type: 'overdue' | 'upcoming';
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: Date | null;
    createdAt: Date;
    Project: {
      id: string;
      name: string;
      projectNumber: string;
    } | null;
  };
  urgencyScore: number;
  message: string;
}

export interface InactiveProject {
  id: string;
  projectNumber: string;
  name: string;
  lastActivityAt: Date | null;
  daysSinceActivity: number;
}

export async function getFocusPoints(): Promise<{
  overdueTasks: FocusPoint[];
  upcomingTasks: FocusPoint[];
  inactiveProjects: InactiveProject[];
  stats: {
    totalActiveTasks: number;
    totalActiveProjects: number;
    tasksCompletedThisWeek: number;
  };
}> {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Überfällige Aufgaben
  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: {
        lt: now
      },
      status: {
        notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED]
      }
    },
    include: {
      Project: {
        select: {
          id: true,
          name: true,
          projectNumber: true
        }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' }
    ]
  });

  // Demnächst fällige Aufgaben (nächste 7 Tage)
  const upcomingTasks = await prisma.task.findMany({
    where: {
      dueDate: {
        gte: now,
        lte: sevenDaysFromNow
      },
      status: {
        notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED]
      },
      priority: {
        in: [TaskPriority.URGENT, TaskPriority.HIGH]
      }
    },
    include: {
      Project: {
        select: {
          id: true,
          name: true,
          projectNumber: true
        }
      }
    },
    orderBy: [
      { dueDate: 'asc' },
      { priority: 'desc' }
    ],
    take: 5
  });

  // Inaktive Projekte (letzte Aktivität > 14 Tage)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  const inactiveProjects = await prisma.project.findMany({
    where: {
      status: ProjectStatus.ACTIVE,
      OR: [
        {
          lastActivityAt: {
            lt: fourteenDaysAgo
          }
        },
        {
          lastActivityAt: null,
          createdAt: {
            lt: fourteenDaysAgo
          }
        }
      ]
    },
    orderBy: [
      { lastActivityAt: 'asc' },
      { createdAt: 'asc' }
    ],
    take: 5
  });

  // Statistiken
  const [totalActiveTasks, totalActiveProjects, tasksCompletedThisWeek] = await Promise.all([
    prisma.task.count({
      where: {
        status: {
          notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED]
        }
      }
    }),
    prisma.project.count({
      where: {
        status: ProjectStatus.ACTIVE
      }
    }),
    prisma.task.count({
      where: {
        status: TaskStatus.DONE,
        updatedAt: {
          gte: oneWeekAgo
        }
      }
    })
  ]);

  // Konvertiere zu FocusPoints mit Urgency Score
  const overdueFocusPoints: FocusPoint[] = overdueTasks.map(task => {
    const daysOverdue = task.dueDate 
      ? Math.floor((now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    const priorityScore = {
      'URGENT': 4,
      'HIGH': 3,
      'MEDIUM': 2,
      'LOW': 1
    }[task.priority] || 2;

    return {
      type: 'overdue' as const,
      task,
      urgencyScore: priorityScore * (1 + daysOverdue * 0.1),
      message: `${daysOverdue} ${daysOverdue === 1 ? 'Tag' : 'Tage'} überfällig`
    };
  });

  const upcomingFocusPoints: FocusPoint[] = upcomingTasks.map(task => {
    const daysUntilDue = task.dueDate 
      ? Math.ceil((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 7;
    
    const priorityScore = {
      'URGENT': 4,
      'HIGH': 3,
      'MEDIUM': 2,
      'LOW': 1
    }[task.priority] || 2;

    return {
      type: 'upcoming' as const,
      task,
      urgencyScore: priorityScore * (1 - daysUntilDue / 7),
      message: daysUntilDue === 0 
        ? 'Heute fällig' 
        : daysUntilDue === 1 
        ? 'Morgen fällig' 
        : `In ${daysUntilDue} Tagen fällig`
    };
  });

  // Konvertiere inaktive Projekte mit Tagen seit letzter Aktivität
  const inactiveProjectsWithDays: InactiveProject[] = inactiveProjects.map(project => {
    const referenceDate = project.lastActivityAt || project.createdAt;
    const daysSinceActivity = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: project.id,
      projectNumber: project.projectNumber,
      name: project.name,
      lastActivityAt: project.lastActivityAt,
      daysSinceActivity
    };
  });

  return {
    overdueTasks: overdueFocusPoints.sort((a, b) => b.urgencyScore - a.urgencyScore),
    upcomingTasks: upcomingFocusPoints,
    inactiveProjects: inactiveProjectsWithDays,
    stats: {
      totalActiveTasks,
      totalActiveProjects,
      tasksCompletedThisWeek
    }
  };
}