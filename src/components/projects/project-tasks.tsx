'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Plus, Calendar, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/modal'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskActionsMenu } from '@/components/task-actions-menu'
import { QuickTaskUpdate } from '@/components/quick-task-update'
import { toast } from 'sonner'
import type { Task } from '@/types'

interface ProjectTasksProps {
  projectId: string
}

export function ProjectTasks({ projectId }: ProjectTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [projectId])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Aufgaben')
      }

      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Fehler beim Laden der Aufgaben')
    } finally {
      setLoading(false)
    }
  }

  const handleTaskCreated = () => {
    setShowCreateModal(false)
    fetchTasks()
  }

  const handleTaskUpdated = () => {
    setEditingTask(null)
    fetchTasks()
  }

  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    URGENT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const priorityLabels = {
    LOW: 'Niedrig',
    MEDIUM: 'Mittel',
    HIGH: 'Hoch',
    URGENT: 'Dringend'
  }

  const statusColors = {
    TODO: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    DONE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ARCHIVED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500'
  }

  const statusLabels = {
    TODO: 'Zu erledigen',
    IN_PROGRESS: 'In Bearbeitung',
    DONE: 'Erledigt',
    ARCHIVED: 'Archiviert'
  }

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = []
    }
    acc[task.status].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Projektaufgaben ({tasks.length})
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neue Aufgabe
          </button>
        </div>
      </div>

      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Noch keine Aufgaben für dieses Projekt
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Erste Aufgabe erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([status, statusTasks]) => (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {statusLabels[status as keyof typeof statusLabels]}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({statusTasks.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map((task) => {
                    const daysUntilDue = getDaysUntilDue(task.dueDate)
                    const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && task.status !== 'DONE'
                    const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3 && task.status !== 'DONE'

                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <QuickTaskUpdate
                          task={task}
                          onUpdate={fetchTasks}
                        />
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                              {priorityLabels[task.priority as keyof typeof priorityLabels]}
                            </span>
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 text-sm ${
                                isOverdue ? 'text-red-600 dark:text-red-400' :
                                isDueSoon ? 'text-orange-600 dark:text-orange-400' :
                                'text-gray-600 dark:text-gray-400'
                              }`}>
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString('de-DE')}
                                {isOverdue && (
                                  <>
                                    <AlertCircle className="w-3 h-3 ml-1" />
                                    <span className="text-xs">({Math.abs(daysUntilDue)} Tage überfällig)</span>
                                  </>
                                )}
                                {isDueSoon && !isOverdue && (
                                  <span className="text-xs">(in {daysUntilDue} {daysUntilDue === 1 ? 'Tag' : 'Tagen'})</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <TaskActionsMenu
                            task={task}
                            onEdit={() => setEditingTask(task)}
                            onDelete={fetchTasks}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title="Neue Aufgabe erstellen"
        >
          <TaskForm
            mode="create"
            defaultProjectId={projectId}
            onSuccess={handleTaskCreated}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          title="Aufgabe bearbeiten"
        >
          <TaskForm
            mode="edit"
            task={editingTask}
            onSuccess={handleTaskUpdated}
            onCancel={() => setEditingTask(null)}
          />
        </Modal>
      )}
    </div>
  )
}