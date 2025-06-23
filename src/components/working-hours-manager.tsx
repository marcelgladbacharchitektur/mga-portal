'use client'

import { useState, useEffect } from 'react'
import { TimeSlotPicker } from './time-slot-picker'
import { toast } from 'sonner'
import { Clock, Save, Copy, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TimeSlot {
  start: string
  end: string
}

interface WorkingHours {
  monday: TimeSlot[]
  tuesday: TimeSlot[]
  wednesday: TimeSlot[]
  thursday: TimeSlot[]
  friday: TimeSlot[]
  saturday: TimeSlot[]
  sunday: TimeSlot[]
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const DAY_NAMES = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag'
}

const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }],
  tuesday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }],
  wednesday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }],
  thursday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }],
  friday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
  saturday: [],
  sunday: []
}

export function WorkingHoursManager() {
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS)
  const [bufferMinutes, setBufferMinutes] = useState(30)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchWorkingHours()
  }, [])

  const fetchWorkingHours = async () => {
    try {
      const response = await fetch('/api/calendar/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.workingHours && typeof data.workingHours === 'object') {
          // Ensure all days exist in the data
          const completeWorkingHours: WorkingHours = {} as WorkingHours
          DAYS.forEach(day => {
            completeWorkingHours[day] = data.workingHours[day] || []
          })
          setWorkingHours(completeWorkingHours)
        }
        if (data.bufferMinutes !== undefined) {
          setBufferMinutes(data.bufferMinutes)
        }
      }
    } catch (error) {
      console.error('Error fetching working hours:', error)
      toast.error('Fehler beim Laden der Arbeitszeiten')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/calendar/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workingHours,
          bufferMinutes
        })
      })

      if (response.ok) {
        toast.success('Arbeitszeiten gespeichert')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving working hours:', error)
      toast.error('Fehler beim Speichern der Arbeitszeiten')
    } finally {
      setSaving(false)
    }
  }

  const handleDayChange = (day: typeof DAYS[number], slots: TimeSlot[]) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: slots
    }))
  }

  const copyToWeekdays = () => {
    const mondaySlots = workingHours.monday
    setWorkingHours(prev => ({
      ...prev,
      tuesday: [...mondaySlots],
      wednesday: [...mondaySlots],
      thursday: [...mondaySlots],
      friday: [...mondaySlots]
    }))
    toast.success('Montag-Zeiten auf alle Wochentage übertragen')
  }

  const applyTemplate = (template: 'standard' | 'morning' | 'afternoon') => {
    let newHours: WorkingHours
    
    switch (template) {
      case 'standard':
        newHours = DEFAULT_WORKING_HOURS
        break
      case 'morning':
        newHours = {
          monday: [{ start: '07:00', end: '12:00' }],
          tuesday: [{ start: '07:00', end: '12:00' }],
          wednesday: [{ start: '07:00', end: '12:00' }],
          thursday: [{ start: '07:00', end: '12:00' }],
          friday: [{ start: '07:00', end: '12:00' }],
          saturday: [],
          sunday: []
        }
        break
      case 'afternoon':
        newHours = {
          monday: [{ start: '13:00', end: '19:00' }],
          tuesday: [{ start: '13:00', end: '19:00' }],
          wednesday: [{ start: '13:00', end: '19:00' }],
          thursday: [{ start: '13:00', end: '19:00' }],
          friday: [{ start: '13:00', end: '19:00' }],
          saturday: [],
          sunday: []
        }
        break
    }
    
    setWorkingHours(newHours)
    toast.success('Vorlage angewendet')
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Detaillierte Arbeitszeiten
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Definieren Sie Ihre Verfügbarkeit für jeden Wochentag. Klicken und ziehen Sie, um Zeitblöcke zu erstellen.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          onClick={() => applyTemplate('standard')}
          variant="secondary"
          size="sm"
        >
          <Calendar className="w-4 h-4" />
          Standard (9-18 Uhr)
        </Button>
        <Button
          onClick={() => applyTemplate('morning')}
          variant="secondary"
          size="sm"
        >
          <Calendar className="w-4 h-4" />
          Vormittags
        </Button>
        <Button
          onClick={() => applyTemplate('afternoon')}
          variant="secondary"
          size="sm"
        >
          <Calendar className="w-4 h-4" />
          Nachmittags
        </Button>
        <Button
          onClick={copyToWeekdays}
          variant="secondary"
          size="sm"
        >
          <Copy className="w-4 h-4" />
          Montag auf Mo-Fr kopieren
        </Button>
      </div>

      {/* Time Slot Pickers */}
      <div className="space-y-6 mb-6">
        {DAYS.map(day => (
          <div key={day} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
            <TimeSlotPicker
              day={DAY_NAMES[day]}
              slots={workingHours[day]}
              onChange={(slots) => handleDayChange(day, slots)}
            />
          </div>
        ))}
      </div>

      {/* Buffer Time */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Pufferzeit zwischen Terminen
        </label>
        <Select
          value={bufferMinutes.toString()}
          onValueChange={(value) => setBufferMinutes(parseInt(value))}
        >
          <SelectTrigger className="w-full sm:w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Keine Pufferzeit</SelectItem>
            <SelectItem value="15">15 Minuten</SelectItem>
            <SelectItem value="30">30 Minuten</SelectItem>
            <SelectItem value="45">45 Minuten</SelectItem>
            <SelectItem value="60">60 Minuten</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Zeit zwischen aufeinanderfolgenden Terminen für Vor- und Nachbereitung
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Speichern...' : 'Arbeitszeiten speichern'}
        </Button>
      </div>
    </div>
  )
}