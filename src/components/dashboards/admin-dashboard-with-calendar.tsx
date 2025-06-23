'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import { AlertCircle, Clock, CheckCircle, TrendingUp, FolderOpen, ListTodo, ChevronRight, Calendar, MapPin, Video, Users, Plus } from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  startTime: string
  endTime: string
  duration: number
  calendarId?: string
  calendarName?: string
  calendarColor?: string
}

interface TodayAppointment {
  time: string
  title: string
  duration: string
  location?: string
  isVideo?: boolean
}

export function AdminDashboardWithCalendar({ focusData }: { focusData: any }) {
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  
  const { overdueTasks, upcomingTasks, inactiveProjects, stats } = focusData

  useEffect(() => {
    loadTodayEvents()
  }, [])

  const loadTodayEvents = async () => {
    try {
      const response = await fetch('/api/calendar/events?view=today&allCalendars=true')
      if (response.ok) {
        const data = await response.json()
        setTodayEvents(data.events)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Termine:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const priorityColors = {
    'URGENT': 'text-red-600 dark:text-red-400',
    'HIGH': 'text-orange-600 dark:text-orange-400',
    'MEDIUM': 'text-yellow-600 dark:text-yellow-400',
    'LOW': 'text-gray-500 dark:text-gray-400'
  }

  const priorityLabels = {
    'URGENT': 'Dringend',
    'HIGH': 'Hoch',
    'MEDIUM': 'Mittel',
    'LOW': 'Niedrig'
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Willkommen im MGA Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {new Date().toLocaleDateString('de-AT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Today's Appointments */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Heutige Termine
                </h2>
                <Link href="/calendar" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Alle →
                </Link>
              </div>
              
              {loadingEvents ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map(event => {
                    const color = event.calendarColor || '#5A614B'
                    return (
                      <div 
                        key={event.id} 
                        className="pl-3 py-2"
                        style={{ borderLeft: `4px solid ${color}` }}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {event.startTime} - {event.endTime}
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {event.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {event.calendarName && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              {event.calendarName}
                            </span>
                          )}
                          {event.duration && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              • {event.duration} Min
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Keine Termine heute
                  </p>
                  <Link 
                    href="/calendar"
                    className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    Termin hinzufügen
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="lg:col-span-2 grid gap-4 md:grid-cols-3">
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

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Termine diese Woche</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.appointmentsThisWeek || 0}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nächster freier Termin</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.nextAvailableSlot || 'Heute'}</p>
                </div>
                <Clock className="w-8 h-8 text-mga-sage" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Überfällige Aufgaben</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueTasks.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Focus Areas - Same as before but with improved styling */}
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

        {/* Rest of the dashboard content remains the same... */}
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

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/tasks"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <ListTodo className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Aufgaben</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Verwalten
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
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Projekte</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Überblick
            </p>
          </Link>

          <Link
            href="/calendar"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-mga-sage" />
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kalender</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Termine
            </p>
          </Link>

          <Link
            href="/termin-buchen"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Plus className="w-8 h-8 text-green-600 dark:text-green-400" />
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Buchungslink</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Teilen
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}