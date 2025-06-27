import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, AlertCircle, ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";

interface TaskDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    notFound();
  }

  const { id } = await params;

  // Lade die Aufgabe mit Projekt-Details
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      Project: {
        select: {
          id: true,
          name: true,
          projectNumber: true,
          ProjectParticipant: session.user.role === 'CLIENT' ? {
            where: {
              contactGroupId: session.user.contactGroupId || undefined
            }
          } : undefined
        }
      }
    }
  });

  // Prüfe ob Aufgabe existiert
  if (!task) {
    notFound();
  }

  // CLIENT darf nur Aufgaben von eigenen Projekten sehen
  if (session.user.role === 'CLIENT' && task.Project) {
    if (!task.Project.ProjectParticipant || task.Project.ProjectParticipant.length === 0) {
      notFound();
    }
  }

  // Status-Konfiguration
  const statusConfig = {
    TODO: { label: "Offen", icon: Clock, color: "text-gray-500" },
    IN_PROGRESS: { label: "In Bearbeitung", icon: AlertCircle, color: "text-blue-600" },
    DONE: { label: "Erledigt", icon: CheckCircle2, color: "text-green-600" },
    CANCELLED: { label: "Abgebrochen", icon: XCircle, color: "text-red-600" }
  };

  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.TODO;

  // Prioritäts-Konfiguration
  const priorityConfig = {
    LOW: { label: "Niedrig", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
    MEDIUM: { label: "Mittel", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
    HIGH: { label: "Hoch", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" }
  };

  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <Link 
          href="/tasks" 
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück zu Aufgaben
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {task.title}
              </h1>
              
              {task.Project && (
                <Link 
                  href={`/projects/${task.Project.id}`}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {task.Project.name} ({task.Project.projectNumber})
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <status.icon className={`h-5 w-5 ${status.color}`} />
              <span className={`text-sm font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Priorität
            </h3>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${priority.color}`}>
              {priority.label}
            </span>
          </div>

          {task.dueDate && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Fälligkeitsdatum
              </h3>
              <div className="flex items-center text-gray-900 dark:text-gray-100">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {new Date(task.dueDate).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Erstellt am
            </h3>
            <p className="text-gray-900 dark:text-gray-100">
              {new Date(task.createdAt).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Zuletzt aktualisiert
            </h3>
            <p className="text-gray-900 dark:text-gray-100">
              {new Date(task.updatedAt).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}