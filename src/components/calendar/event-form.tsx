'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Type, AlignLeft, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EventFormProps {
  event?: {
    id: string
    title: string
    description?: string
    start: Date | string
    end: Date | string
    location?: string
    calendarId?: string
  }
  onSuccess: () => void
  onCancel: () => void
}

export function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const [loading, setLoading] = useState(false)
  const [calendars, setCalendars] = useState<{ id: string; name: string; color?: string }[]>([])
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event ? new Date(event.start).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: event ? new Date(event.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false }) : '09:00',
    endTime: event ? new Date(event.end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false }) : '10:00',
    location: event?.location || '',
    calendarId: event?.calendarId || ''
  })

  useEffect(() => {
    fetchCalendars()
  }, [])

  const fetchCalendars = async () => {
    try {
      const response = await fetch('/api/calendar/calendars')
      if (response.ok) {
        const data = await response.json()
        setCalendars(data.calendars)
        if (!formData.calendarId && data.calendars.length > 0) {
          setFormData(prev => ({ ...prev, calendarId: data.calendars[0].id }))
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kalender:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`)

      if (endDateTime <= startDateTime) {
        toast.error('Die Endzeit muss nach der Startzeit liegen')
        setLoading(false)
        return
      }

      const body = {
        title: formData.title,
        description: formData.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: formData.location,
        calendarId: formData.calendarId
      }

      const url = event 
        ? `/api/calendar/events/${event.id}`
        : '/api/calendar/events'
      
      const response = await fetch(url, {
        method: event ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Speichern')
      }

      toast.success(event ? 'Termin aktualisiert' : 'Termin erstellt')
      onSuccess()
    } catch (error) {
      console.error('Fehler:', error)
      toast.error('Fehler beim Speichern des Termins')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Kalender-Auswahl */}
      {calendars.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kalender
          </label>
          <Select
            value={formData.calendarId}
            onValueChange={(value) => setFormData({ ...formData, calendarId: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Kalender auswählen" />
            </SelectTrigger>
            <SelectContent>
              {calendars.map(cal => (
                <SelectItem key={cal.id} value={cal.id}>
                  {cal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Titel */}
      <div className="space-y-2">
        <Label>
          <Type className="w-4 h-4 inline mr-2" />
          Titel *
        </Label>
        <Input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Termin-Titel"
        />
      </div>

      {/* Datum und Zeit */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>
            <Calendar className="w-4 h-4 inline mr-2" />
            Datum *
          </Label>
          <Input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>
            <Clock className="w-4 h-4 inline mr-2" />
            Von *
          </Label>
          <Input
            type="time"
            required
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>
            <Clock className="w-4 h-4 inline mr-2" />
            Bis *
          </Label>
          <Input
            type="time"
            required
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
        </div>
      </div>

      {/* Ort */}
      <div className="space-y-2">
        <Label>
          <MapPin className="w-4 h-4 inline mr-2" />
          Ort
        </Label>
        <Input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Ort oder Adresse"
        />
      </div>

      {/* Beschreibung */}
      <div className="space-y-2">
        <Label>
          <AlignLeft className="w-4 h-4 inline mr-2" />
          Beschreibung
        </Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          placeholder="Zusätzliche Informationen..."
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 inline mr-2" />
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 inline mr-2" />
          {loading ? 'Speichern...' : (event ? 'Aktualisieren' : 'Erstellen')}
        </button>
      </div>
    </form>
  )
}