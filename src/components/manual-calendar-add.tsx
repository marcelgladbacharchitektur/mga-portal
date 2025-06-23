'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  onCalendarAdded: () => void
}

export function ManualCalendarAdd({ onCalendarAdded }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [calendarId, setCalendarId] = useState('')
  const [calendarName, setCalendarName] = useState('')
  const [role, setRole] = useState<'BLOCKING' | 'INFO'>('INFO')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!calendarId || !calendarName) {
      toast.error('Bitte füllen Sie alle Felder aus')
      return
    }
    
    setSaving(true)
    
    try {
      const response = await fetch('/api/registered-calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleCalendarId: calendarId,
          name: calendarName,
          roleInPortal: role
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Registrieren')
      }
      
      toast.success(`Kalender "${calendarName}" wurde registriert`)
      setCalendarId('')
      setCalendarName('')
      setRole('INFO')
      setIsOpen(false)
      onCalendarAdded()
    } catch (error: any) {
      console.error('Fehler beim Registrieren:', error)
      toast.error(error.message || 'Fehler beim Registrieren des Kalenders')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
      >
        <Plus className="w-4 h-4" />
        Kalender manuell hinzufügen
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Kalender-ID</label>
        <input
          type="text"
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          placeholder="z.B. kalender.mga.portal@gmail.com"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          disabled={saving}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Die Google Calendar ID (oft die E-Mail-Adresse)
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Anzeigename</label>
        <input
          type="text"
          value={calendarName}
          onChange={(e) => setCalendarName(e.target.value)}
          placeholder="z.B. Termine Info"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          disabled={saving}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Rolle im Portal</label>
        <Select
          value={role}
          onValueChange={(value) => setRole(value as 'BLOCKING' | 'INFO')}
          disabled={saving}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INFO">Info (nur Anzeige)</SelectItem>
            <SelectItem value="BLOCKING">Blocker (blockiert Termine)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Wird gespeichert...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Kalender hinzufügen
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setCalendarId('')
            setCalendarName('')
            setRole('INFO')
          }}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}