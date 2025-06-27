'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Plus, Trash2, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ManualCalendarAdd } from './manual-calendar-add'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface GoogleCalendar {
  id: string
  summary: string
  primary?: boolean
}

interface RegisteredCalendar {
  id: string
  googleCalendarId: string
  name: string
  roleInPortal: 'BLOCKING' | 'INFO'
}

export function DynamicCalendarManager() {
  const [loading, setLoading] = useState(true)
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([])
  const [registeredCalendars, setRegisteredCalendars] = useState<RegisteredCalendar[]>([])
  const [error, setError] = useState<string | null>(null)
  const [registering, setRegistering] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Lade Google Kalender
      const googleResponse = await fetch('/api/calendar/calendars')
      const googleData = await googleResponse.json()
      
      if (!googleResponse.ok) {
        throw new Error(googleData.error || 'Fehler beim Laden der Google Kalender')
      }
      
      console.log('Google Calendars loaded:', googleData.calendars)
      setGoogleCalendars(googleData.calendars || [])
      
      // Lade registrierte Kalender
      const registeredResponse = await fetch('/api/registered-calendars')
      const registeredData = await registeredResponse.json()
      
      if (!registeredResponse.ok) {
        throw new Error(registeredData.error || 'Fehler beim Laden der registrierten Kalender')
      }
      
      console.log('Registered Calendars loaded:', registeredData)
      setRegisteredCalendars(registeredData)
    } catch (error: any) {
      console.error('Fehler beim Laden der Daten:', error)
      setError(error.message || 'Fehler beim Laden der Kalenderdaten')
    } finally {
      setLoading(false)
    }
  }

  const registerCalendar = async (googleCalendar: GoogleCalendar, role: 'BLOCKING' | 'INFO') => {
    setRegistering(googleCalendar.id)
    
    try {
      const response = await fetch('/api/registered-calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleCalendarId: googleCalendar.id,
          name: googleCalendar.summary,
          roleInPortal: role
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Registrieren')
      }
      
      setRegisteredCalendars([...registeredCalendars, data])
      toast.success(`Kalender "${googleCalendar.summary}" wurde als ${role === 'BLOCKING' ? 'Blocker' : 'Info'}-Kalender registriert`)
    } catch (error: any) {
      console.error('Fehler beim Registrieren:', error)
      toast.error(error.message || 'Fehler beim Registrieren des Kalenders')
    } finally {
      setRegistering(null)
    }
  }

  const updateCalendarRole = async (calendar: RegisteredCalendar, newRole: 'BLOCKING' | 'INFO') => {
    setUpdating(calendar.id)
    
    try {
      const response = await fetch('/api/registered-calendars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: calendar.id,
          roleInPortal: newRole
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Aktualisieren')
      }
      
      setRegisteredCalendars(
        registeredCalendars.map(cal => 
          cal.id === calendar.id ? { ...cal, roleInPortal: newRole } : cal
        )
      )
      toast.success('Kalenderrolle wurde aktualisiert')
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren:', error)
      toast.error(error.message || 'Fehler beim Aktualisieren der Kalenderrolle')
    } finally {
      setUpdating(null)
    }
  }

  const deleteCalendar = async (calendar: RegisteredCalendar) => {
    if (!confirm(`Möchten Sie "${calendar.name}" wirklich aus dem Portal entfernen?`)) {
      return
    }
    
    setDeleting(calendar.id)
    
    try {
      const response = await fetch(`/api/registered-calendars?id=${calendar.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Löschen')
      }
      
      setRegisteredCalendars(registeredCalendars.filter(cal => cal.id !== calendar.id))
      toast.success('Kalender wurde aus dem Portal entfernt')
    } catch (error: any) {
      console.error('Fehler beim Löschen:', error)
      toast.error(error.message || 'Fehler beim Entfernen des Kalenders')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  // Finde nicht-registrierte Kalender
  const registeredIds = registeredCalendars.map(rc => rc.googleCalendarId)
  const unregisteredCalendars = googleCalendars.filter(gc => !registeredIds.includes(gc.id))
  
  console.log('Abgleich-Debug:', {
    googleCalendars: googleCalendars.length,
    registeredCalendars: registeredCalendars.length,
    registeredIds,
    unregisteredCalendars: unregisteredCalendars.length
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Dynamische Kalender-Verwaltung
        </h3>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/calendar/discover')
                const data = await response.json()
                console.log('Discovered calendars:', data)
                toast.success('Kalender-Discovery abgeschlossen - siehe Browser-Konsole')
              } catch (error) {
                console.error('Discovery error:', error)
                toast.error('Fehler beim Discovery')
              }
            }}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Kalender-IDs entdecken"
          >
            IDs finden
          </button>
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Aktualisieren"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Sektion 1: Verfügbare Google Kalender */}
      <div className="mb-8">
        <h4 className="text-sm font-medium mb-3">Verfügbare Google Kalender</h4>
        {unregisteredCalendars.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Keine automatisch erkannten Kalender verfügbar.
            </p>
            <ManualCalendarAdd onCalendarAdded={loadData} />
          </div>
        ) : (
          <div className="space-y-2">
            {unregisteredCalendars.map(calendar => (
              <div
                key={calendar.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <span className="font-medium">{calendar.summary}</span>
                  {calendar.primary && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Hauptkalender)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => registerCalendar(calendar, 'BLOCKING')}
                    disabled={registering === calendar.id}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {registering === calendar.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    Als Blocker
                  </button>
                  <button
                    onClick={() => registerCalendar(calendar, 'INFO')}
                    disabled={registering === calendar.id}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {registering === calendar.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    Als Info
                  </button>
                </div>
              </div>
            ))}
            <ManualCalendarAdd onCalendarAdded={loadData} />
          </div>
        )}
      </div>

      {/* Sektion 2: Im Portal registrierte Kalender */}
      <div>
        <h4 className="text-sm font-medium mb-3">Im Portal registrierte Kalender</h4>
        {registeredCalendars.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Noch keine Kalender im Portal registriert.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kalender</TableHead>
                <TableHead>Rolle im Portal</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registeredCalendars.map(calendar => (
                <TableRow key={calendar.id}>
                  <TableCell>
                    <span className="font-medium">{calendar.name}</span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={calendar.roleInPortal}
                      onValueChange={(value) => updateCalendarRole(calendar, value as 'BLOCKING' | 'INFO')}
                      disabled={updating === calendar.id}
                    >
                      <SelectTrigger className={`w-48 text-sm ${
                        calendar.roleInPortal === 'BLOCKING'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                          : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BLOCKING">Blocker (blockiert Termine)</SelectItem>
                        <SelectItem value="INFO">Info (nur Anzeige)</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => deleteCalendar(calendar)}
                      disabled={deleting === calendar.id}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Aus Portal entfernen"
                    >
                      {deleting === calendar.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}