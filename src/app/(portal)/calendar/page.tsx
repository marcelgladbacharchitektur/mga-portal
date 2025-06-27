'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin, RefreshCw, ExternalLink, Edit, Trash2 } from 'lucide-react'
import { Modal } from '@/components/modal'
import { EventForm } from '@/components/calendar/event-form'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { de } from 'date-fns/locale'

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

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [showAllCalendars, setShowAllCalendars] = useState(true)
  const [availableCalendars, setAvailableCalendars] = useState<{ id: string; name: string; color?: string }[]>([])

  useEffect(() => {
    fetchAppointments()
    fetchCalendars()
  }, [currentMonth, showAllCalendars])

  const fetchCalendars = async () => {
    try {
      const response = await fetch('/api/calendar/calendars')
      if (response.ok) {
        const data = await response.json()
        console.log('Available calendars:', data.calendars)
        setAvailableCalendars(data.calendars || [])
      } else {
        console.error('Failed to fetch calendars:', response.status)
      }
    } catch (error) {
      console.error('Error fetching calendars:', error)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      
      const response = await fetch(
        `/api/calendar/events?view=month&year=${year}&month=${month}&allCalendars=${showAllCalendars}`
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('API Error:', data)
        throw new Error(data.error || 'Fehler beim Laden der Termine')
      }
      
      console.log(`Loaded ${data.events?.length || 0} events for ${year}/${month + 1}`)
      setAppointments(data.events || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Fehler beim Laden der Termine')
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.start), day)
    )
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const today = new Date()

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEditModal(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Möchten Sie diesen Termin wirklich löschen?')) return

    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Fehler beim Löschen')

      toast.success('Termin gelöscht')
      fetchAppointments()
      setShowEditModal(false)
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Fehler beim Löschen des Termins')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <CalendarIcon className="w-8 h-8" />
              Kalender
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Verwalten Sie Ihre Termine
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neuer Termin
          </button>
        </div>

        {/* Calendar Selector */}
        {availableCalendars.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Kalender anzeigen
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowAllCalendars(!showAllCalendars)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      showAllCalendars
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Alle Kalender
                  </button>
                  {availableCalendars.map(cal => (
                    <div
                      key={cal.id}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg"
                    >
                      {cal.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cal.color }}
                        />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {cal.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={fetchAppointments}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Aktualisieren"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Calendar Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  view === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Monat
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  view === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                disabled
              >
                Woche
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  view === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                disabled
              >
                Tag
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
              {getDaysInMonth().map((day, index) => {
                const dayAppointments = getAppointmentsForDay(day)
                const isToday = isSameDay(day, today)
                const isCurrentMonth = isSameMonth(day, currentMonth)

                return (
                  <div
                    key={index}
                    className={`
                      bg-white dark:bg-gray-800 p-2 min-h-[100px]
                      ${!isCurrentMonth ? 'opacity-50' : ''}
                      ${isToday ? 'ring-2 ring-blue-500' : ''}
                    `}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((appointment) => {
                        const bgColor = appointment.calendarColor || '#3B82F6'
                        return (
                          <div
                            key={appointment.id}
                            className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: `${bgColor}20`,
                              borderLeft: `3px solid ${bgColor}`
                            }}
                            title={`${appointment.title}${appointment.calendarName ? ` (${appointment.calendarName})` : ''}`}
                            onClick={() => handleEventClick(appointment)}
                          >
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{appointment.startTime}</span>
                            </div>
                            <div className="truncate">{appointment.title}</div>
                          </div>
                        )
                      })}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                          +{dayAppointments.length - 3} weitere
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Anstehende Termine
          </h3>
          
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Keine Termine in diesem Monat
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ersten Termin erstellen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments
                .filter(a => new Date(a.start) >= today)
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .slice(0, 5)
                .map((appointment) => {
                  const color = appointment.calendarColor || '#3B82F6'
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      style={{
                        borderLeft: `4px solid ${color}`
                      }}
                      onClick={() => handleEventClick(appointment)}
                    >
                      <div className="flex-shrink-0 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {format(new Date(appointment.start), 'd')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(appointment.start), 'MMM', { locale: de })}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {appointment.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appointment.startTime} - {appointment.endTime}
                          </span>
                          {appointment.calendarName && (
                            <span className="flex items-center gap-1">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: color }}
                              />
                              {appointment.calendarName}
                            </span>
                          )}
                          {appointment.duration && (
                            <span className="text-xs">
                              {appointment.duration} Minuten
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title="Neuer Termin"
          size="xl"
        >
          <EventForm
            onSuccess={() => {
              setShowCreateModal(false)
              fetchAppointments()
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEvent && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowEditModal(false)
            setSelectedEvent(null)
          }}
          title="Termin bearbeiten"
          size="xl"
        >
          <div>
            <EventForm
              event={selectedEvent}
              onSuccess={() => {
                setShowEditModal(false)
                setSelectedEvent(null)
                fetchAppointments()
              }}
              onCancel={() => {
                setShowEditModal(false)
                setSelectedEvent(null)
              }}
            />
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Termin löschen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}