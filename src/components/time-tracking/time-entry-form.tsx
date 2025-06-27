import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ProjectCombobox } from '@/components/project-combobox'
import type { Project, Task } from '@/types'
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

interface TimeEntryFormProps {
  onSuccess: () => void
  onCancel: () => void
  defaultProjectId?: string
  defaultStartTime?: Date
  defaultEndTime?: Date
  defaultDuration?: number
}

export function TimeEntryForm({ onSuccess, onCancel, defaultProjectId, defaultStartTime, defaultEndTime, defaultDuration }: TimeEntryFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    projectId: defaultProjectId || '',
    taskId: '',
    startDate: (defaultStartTime || new Date()).toISOString().split('T')[0],
    startTime: (defaultStartTime || new Date()).toTimeString().slice(0, 5),
    endDate: (defaultEndTime || new Date()).toISOString().split('T')[0],
    endTime: defaultEndTime ? defaultEndTime.toTimeString().slice(0, 5) : '',
    durationMinutes: defaultDuration ? defaultDuration.toString() : '',
    isBillable: true,
  })
  
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [useManualDuration, setUseManualDuration] = useState(!!defaultDuration && !defaultEndTime)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (formData.projectId) {
      fetchProjectTasks(formData.projectId)
    } else {
      setTasks([])
      setFormData(prev => ({ ...prev, taskId: '' }))
    }
  }, [formData.projectId])

  useEffect(() => {
    // Berechne Dauer wenn Start- und Endzeit vorhanden
    if (!useManualDuration && formData.startTime && formData.endTime && formData.startDate && formData.endDate) {
      const start = new Date(`${formData.startDate}T${formData.startTime}`)
      const end = new Date(`${formData.endDate}T${formData.endTime}`)
      const diffMs = end.getTime() - start.getTime()
      const diffMinutes = Math.floor(diffMs / 60000)
      
      if (diffMinutes > 0) {
        setFormData(prev => ({ ...prev, durationMinutes: diffMinutes.toString() }))
      }
    }
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime, useManualDuration])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Fehler beim Laden der Projekte')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Fehler beim Laden der Projekte')
    }
  }

  const fetchProjectTasks = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      if (!response.ok) throw new Error('Fehler beim Laden der Aufgaben')
      const data = await response.json()
      setTasks(data.filter((task: Task) => task.status !== 'DONE' && task.status !== 'ARCHIVED'))
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Fehler beim Laden der Aufgaben')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = formData.endTime 
        ? new Date(`${formData.endDate}T${formData.endTime}`)
        : null

      const duration = useManualDuration 
        ? parseInt(formData.durationMinutes)
        : endDateTime 
          ? Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 60000)
          : parseInt(formData.durationMinutes)

      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          projectId: formData.projectId || null,
          taskId: formData.taskId || null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime?.toISOString() || null,
          durationMinutes: duration,
          isBillable: formData.isBillable,
        }),
      })

      if (!response.ok) throw new Error('Fehler beim Erstellen des Zeiteintrags')

      toast.success('Zeiteintrag erfolgreich erstellt')
      onSuccess()
    } catch (error) {
      console.error('Error creating time entry:', error)
      toast.error('Fehler beim Erstellen des Zeiteintrags')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: string) => {
    if (!minutes) return ''
    const mins = parseInt(minutes)
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    if (hours > 0) {
      return `${hours}h ${remainingMins}min`
    }
    return `${remainingMins}min`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Beschreibung *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Was haben Sie gemacht?"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Projekt
          </label>
          <ProjectCombobox
            value={formData.projectId}
            onChange={(projectId) => setFormData({ ...formData, projectId })}
            placeholder="Projekt auswählen (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Aufgabe
          </label>
          <Select
            value={formData.taskId || "none"}
            onValueChange={(value) => setFormData({ ...formData, taskId: value === "none" ? "" : value })}
            disabled={!formData.projectId || tasks.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Keine Aufgabe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine Aufgabe</SelectItem>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Zeiterfassung</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Startdatum</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Startzeit</Label>
            <Input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Enddatum</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              disabled={useManualDuration}
            />
          </div>
          <div className="space-y-2">
            <Label>Endzeit</Label>
            <Input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              disabled={useManualDuration}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useManualDuration}
              onChange={(e) => setUseManualDuration(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Dauer manuell eingeben
            </span>
          </label>
        </div>

        {useManualDuration && (
          <div className="space-y-2">
            <Label>Dauer (Minuten)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                min="1"
                className="w-32"
                required
              />
              {formData.durationMinutes && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  = {formatDuration(formData.durationMinutes)}
                </span>
              )}
            </div>
          </div>
        )}

        {!useManualDuration && formData.durationMinutes && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Berechnete Dauer: <strong>{formatDuration(formData.durationMinutes)}</strong>
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isBillable}
            onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Abrechenbar
          </span>
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={loading || (!formData.endTime && !useManualDuration)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Erstelle...' : 'Erstellen'}
        </button>
      </div>
    </form>
  )
}