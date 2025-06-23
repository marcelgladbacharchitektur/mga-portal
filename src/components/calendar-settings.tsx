'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Check, Loader2, AlertCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CalendarOption {
  id: string
  summary: string
  primary?: boolean
}

interface CalendarSettings {
  blockerCalendarId: string | null
  infoCalendarIds: string[]
}

export function CalendarSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [calendars, setCalendars] = useState<CalendarOption[]>([])
  const [settings, setSettings] = useState<CalendarSettings>({
    blockerCalendarId: null,
    infoCalendarIds: []
  })
  const [error, setError] = useState<string | null>(null)
  const [showCreateDefaults, setShowCreateDefaults] = useState(false)

  useEffect(() => {
    fetchCalendarSettings()
  }, [])

  const fetchCalendarSettings = async () => {
    try {
      const response = await fetch('/api/calendar/settings')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Laden der Einstellungen')
      }
      
      setCalendars(data.availableCalendars || [])
      if (data.settings) {
        setSettings(data.settings)
      }
      
      if (data.error) {
        setError(data.error)
      }
      
      // Check if we should show the create defaults button
      const hasBlocker = calendars.some(cal => 
        cal.summary.includes('MGA Blocker') || cal.summary.includes('Gebuchte Termine')
      )
      const hasInfo = calendars.some(cal => 
        cal.summary.includes('MGA Info') || cal.summary.includes('Deadlines')
      )
      setShowCreateDefaults(!hasBlocker || !hasInfo)
    } catch (error) {
      console.error('Error fetching calendar settings:', error)
      setError('Fehler beim Laden der Kalender-Einstellungen')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/calendar/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (!response.ok) {
        throw new Error('Fehler beim Speichern')
      }
      
      toast.success('Kalender-Einstellungen gespeichert')
    } catch (error) {
      console.error('Error saving calendar settings:', error)
      toast.error('Fehler beim Speichern der Einstellungen')
    } finally {
      setSaving(false)
    }
  }

  const handleBlockerCalendarChange = (calendarId: string) => {
    setSettings(prev => ({
      ...prev,
      blockerCalendarId: calendarId === '' ? null : calendarId
    }))
  }

  const handleInfoCalendarToggle = (calendarId: string) => {
    setSettings(prev => ({
      ...prev,
      infoCalendarIds: prev.infoCalendarIds.includes(calendarId)
        ? prev.infoCalendarIds.filter(id => id !== calendarId)
        : [...prev.infoCalendarIds, calendarId]
    }))
  }

  const createDefaultCalendars = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/calendar/create-defaults', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Kalender')
      }
      
      const data = await response.json()
      toast.success(data.message)
      
      // Reload calendar settings
      await fetchCalendarSettings()
    } catch (error) {
      console.error('Error creating default calendars:', error)
      toast.error('Fehler beim Erstellen der Standard-Kalender')
    } finally {
      setCreating(false)
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <CalendarDays className="w-5 h-5" />
        Multi-Kalender Einstellungen
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm text-yellow-700 dark:text-yellow-300">{error}</span>
        </div>
      )}

      {calendars.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Keine Kalender verfügbar. Bitte stellen Sie sicher, dass Google Calendar verbunden ist.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Create Default Calendars Button */}
          {showCreateDefaults && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Die empfohlenen Kalender wurden nicht gefunden. Möchten Sie sie automatisch erstellen?
              </p>
              <Button
                onClick={createDefaultCalendars}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Erstelle Kalender...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Standard-Kalender erstellen
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Blocker Calendar Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Welcher Kalender blockiert Ihre Verfügbarkeit?
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Termine in diesem Kalender werden als nicht verfügbar behandelt
            </p>
            <Select
              value={settings.blockerCalendarId || 'none'}
              onValueChange={(value) => handleBlockerCalendarChange(value === 'none' ? '' : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kein Kalender ausgewählt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Kalender ausgewählt</SelectItem>
                {calendars.map(calendar => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    {calendar.summary} {calendar.primary && '(Hauptkalender)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info Calendars Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Welche zusätzlichen Kalender sollen angezeigt werden?
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Diese Kalender werden nur zur Information angezeigt, blockieren aber keine Termine
            </p>
            <div className="space-y-2">
              {calendars.map(calendar => (
                <label
                  key={calendar.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <input
                    type="checkbox"
                    checked={settings.infoCalendarIds.includes(calendar.id)}
                    onChange={() => handleInfoCalendarToggle(calendar.id)}
                    disabled={calendar.id === settings.blockerCalendarId}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className={`text-sm ${
                    calendar.id === settings.blockerCalendarId 
                      ? 'text-gray-400 dark:text-gray-500' 
                      : 'text-gray-700 dark:text-gray-200'
                  }`}>
                    {calendar.summary} {calendar.primary && '(Hauptkalender)'}
                    {calendar.id === settings.blockerCalendarId && ' - Bereits als Blocker ausgewählt'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Einstellungen speichern
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}