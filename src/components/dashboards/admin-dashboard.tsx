import Link from "next/link";
import { AlertCircle, Clock, CheckCircle, TrendingUp, FolderOpen, ListTodo, ChevronRight, Calendar } from "lucide-react";
import { getFocusPoints } from "@/lib/dashboard";

export async function AdminDashboard() {
  const { overdueTasks, upcomingTasks, inactiveProjects, stats } = await getFocusPoints();

  const priorityColors = {
    'URGENT': 'text-red-600 dark:text-red-400',
    'HIGH': 'text-orange-600 dark:text-orange-400',
    'MEDIUM': 'text-yellow-600 dark:text-yellow-400',
    'LOW': 'text-gray-500 dark:text-gray-400'
  };

  const priorityLabels = {
    'URGENT': 'Dringend',
    'HIGH': 'Hoch',
    'MEDIUM': 'Mittel',
    'LOW': 'Niedrig'
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Willkommen im MGA Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ihr Fokus für heute: {overdueTasks.length + upcomingTasks.length} wichtige Aufgaben benötigen Ihre Aufmerksamkeit.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aktive Projekte</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalActiveProjects}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Offene Aufgaben</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalActiveTasks}</p>
              </div>
              <ListTodo className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Diese Woche erledigt</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.tasksCompletedThisWeek}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Jetzt handeln: Überfällige Aufgaben
              </h2>
              <div className="space-y-3">
                {overdueTasks.map(({ task, message }) => (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="block bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className={`flex items-center gap-1 font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            {priorityLabels[task.priority as keyof typeof priorityLabels]}
                          </span>
                          <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {message}
                          </span>
                          {task.Project && (
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FolderOpen className="w-3.5 h-3.5" />
                              {task.Project.projectNumber} - {task.Project.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <div className="mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Im Fokus: Anstehende Aufgaben
              </h2>
              <div className="space-y-3">
                {upcomingTasks.map(({ task, message }) => (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="block bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className={`flex items-center gap-1 font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            {priorityLabels[task.priority as keyof typeof priorityLabels]}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {message}
                          </span>
                          {task.Project && (
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FolderOpen className="w-3.5 h-3.5" />
                              {task.Project.projectNumber} - {task.Project.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inactive Projects */}
        {inactiveProjects.length > 0 && (
          <div className="mb-8">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Achtung: Inaktive Projekte
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-4">
                Diese Projekte hatten seit mehr als 14 Tagen keine Aktivität und benötigen möglicherweise Ihre Aufmerksamkeit.
              </p>
              <div className="space-y-3">
                {inactiveProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400">#{project.projectNumber}</span>
                          {project.name}
                        </h3>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          {project.daysSinceActivity === 0 
                            ? 'Heute erstellt' 
                            : project.daysSinceActivity === 1
                            ? '1 Tag ohne Aktivität'
                            : `${project.daysSinceActivity} Tage ohne Aktivität`}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {overdueTasks.length === 0 && upcomingTasks.length === 0 && inactiveProjects.length === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
              Alles im grünen Bereich!
            </h2>
            <p className="text-green-700 dark:text-green-300 mb-6">
              Keine überfälligen oder dringenden Aufgaben. Sie haben alles im Griff.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/tasks"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ListTodo className="w-5 h-5" />
                Alle Aufgaben anzeigen
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FolderOpen className="w-5 h-5" />
                Zu den Projekten
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/tasks"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <ListTodo className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Aufgaben verwalten</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Neue Aufgaben erstellen und bestehende bearbeiten
            </p>
          </Link>

          <Link
            href="/projects"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <FolderOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Projekte ansehen</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Alle Projekte im Überblick
            </p>
          </Link>

          <Link
            href="/projects/new"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <FolderOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Neues Projekt</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Ein neues Projekt anlegen
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}