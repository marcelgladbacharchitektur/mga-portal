'use client'

import { useState, useEffect } from 'react'
import { Timer, Calendar, Clock, Euro, Plus, Filter } from 'lucide-react'
import { Modal } from '@/components/modal'
import { TimeEntryForm } from '@/components/time-tracking/time-entry-form'
import { toast } from 'sonner'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'
import type { TimeEntry, Project, Task } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type TimeEntryWithRelations = TimeEntry & {
  project: Project | null
  task: Task | null
}

export default function TimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('week')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchTimeEntries()
    fetchProjects()
  }, [filter, selectedProject])

  const fetchTimeEntries = async () => {
    try {
      setLoading(true)
      let url = '/api/time-entries?'
      
      // Zeitfilter
      const now = new Date()
      if (filter === 'today') {
        url += `from=${now.toISOString().split('T')[0]}&to=${now.toISOString().split('T')[0]}`
      } else if (filter === 'week') {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
        url += `from=${weekStart.toISOString().split('T')[0]}&to=${weekEnd.toISOString().split('T')[0]}`
      } else if (filter === 'month') {
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        url += `from=${monthStart.toISOString().split('T')[0]}&to=${monthEnd.toISOString().split('T')[0]}`
      }

      // Projektfilter
      if (selectedProject) {
        url += `&projectId=${selectedProject}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        console.error('Time entries fetch error:', response.status, response.statusText)
        throw new Error('Fehler beim Laden der Zeiteinträge')
      }
      
      const data = await response.json()
      setTimeEntries(data || [])
    } catch (error) {
      console.error('Error fetching time entries:', error)
      toast.error('Fehler beim Laden der Zeiteinträge')
      setTimeEntries([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Fehler beim Laden der Projekte')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Zeiteintrag wirklich löschen?')) return

    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Delete error:', response.status, errorData)
        throw new Error(errorData.error || 'Fehler beim Löschen')
      }

      toast.success('Zeiteintrag gelöscht')
      fetchTimeEntries()
    } catch (error: any) {
      console.error('Error deleting time entry:', error)
      toast.error(error.message || 'Fehler beim Löschen des Zeiteintrags')
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins}min`
  }

  const calculateTotalTime = () => {
    return timeEntries.reduce((total, entry) => total + (entry.durationMinutes || 0), 0)
  }

  const calculateBillableTime = () => {
    return timeEntries
      .filter(entry => entry.isBillable)
      .reduce((total, entry) => total + (entry.durationMinutes || 0), 0)
  }

  const groupEntriesByDate = () => {
    const grouped: Record<string, TimeEntryWithRelations[]> = {}
    
    timeEntries.forEach(entry => {
      const date = format(new Date(entry.startTime), 'yyyy-MM-dd')
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(entry)
    })

    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalTime = calculateTotalTime()
  const billableTime = calculateBillableTime()
  const groupedEntries = groupEntriesByDate()

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Timer className="w-8 h-8" />
              Zeiterfassung
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Verwalten Sie Ihre Arbeitszeiten
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neuer Eintrag
          </button>
        </div>

        {/* Statistiken */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Gesamtzeit</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatDuration(totalTime)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Euro className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Abrechenbar</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatDuration(billableTime)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Einträge</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {timeEntries.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Timer className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Ø pro Tag</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {groupedEntries.length > 0 ? formatDuration(Math.floor(totalTime / groupedEntries.length)) : '0min'}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('today')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Heute
              </button>
              <button
                onClick={() => setFilter('week')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Diese Woche
              </button>
              <button
                onClick={() => setFilter('month')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Dieser Monat
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Alle
              </button>
            </div>

            <Select
              value={selectedProject || "all"}
              onValueChange={(value) => setSelectedProject(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-64 text-sm">
                <SelectValue placeholder="Alle Projekte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Projekte</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectNumber} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Zeiteinträge */}
        <div className="space-y-6">
          {groupedEntries.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <Timer className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Keine Zeiteinträge
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Erstellen Sie Ihren ersten Zeiteintrag, um Ihre Arbeitszeiten zu verfolgen.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ersten Eintrag erstellen
              </button>
            </div>
          ) : (
            groupedEntries.map(([date, entries]) => (
              <div key={date}>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {format(new Date(date), 'EEEE, d. MMMM yyyy', { locale: de })}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    ({formatDuration(entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0))})
                  </span>
                </h3>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {entry.description}
                          </h4>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(entry.startTime), 'HH:mm')}
                              {entry.endTime && ` - ${format(new Date(entry.endTime), 'HH:mm')}`}
                            </span>
                            <span className="font-medium">
                              {formatDuration(entry.durationMinutes || 0)}
                            </span>
                            {entry.project && (
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                {entry.project.projectNumber} - {entry.project.name}
                              </span>
                            )}
                            {entry.task && (
                              <span className="text-gray-500 dark:text-gray-500">
                                • {entry.task.title}
                              </span>
                            )}
                            {entry.isBillable && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Abrechenbar
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="ml-4 p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title="Neuer Zeiteintrag"
          size="xl"
        >
          <TimeEntryForm
            onSuccess={() => {
              setShowCreateModal(false)
              fetchTimeEntries()
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}