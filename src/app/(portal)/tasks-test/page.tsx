import { prisma } from "@/lib/prisma";

export default async function TasksTestPage() {
  try {
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true
      },
      take: 5
    });

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Tasks Test Page</h1>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          {JSON.stringify(tasks, null, 2)}
        </pre>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <pre className="bg-red-100 dark:bg-red-900 p-4 rounded text-red-800 dark:text-red-200">
          {error instanceof Error ? error.message : 'Unknown error'}
        </pre>
      </div>
    );
  }
}