import { prisma } from "@/lib/prisma";
import { TaskList } from "./task-list";

export default async function TasksPage() {
  try {
    const tasks = await prisma.task.findMany({
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
        { createdAt: 'desc' }
      ]
    });

    // Convert dates to strings for client component
    const serializedTasks = tasks.map(task => ({
      ...task,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }));

    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <TaskList initialTasks={serializedTasks} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading tasks:', error);
    
    // Fallback UI
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Fehler beim Laden der Aufgaben
            </h2>
            <p className="text-red-600 dark:text-red-300">
              {error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten'}
            </p>
          </div>
        </div>
      </div>
    );
  }
}