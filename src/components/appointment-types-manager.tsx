'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AppointmentType {
  id: string
  name: string
  durationMinutes: number
  description?: string
  isActive: boolean
}

export function AppointmentTypesManager() {
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newType, setNewType] = useState({
    name: '',
    durationMinutes: 60,
    description: ''
  })
  const [editForm, setEditForm] = useState({
    name: '',
    durationMinutes: 0,
    description: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchAppointmentTypes()
    }
  }, [mounted])

  const fetchAppointmentTypes = async () => {
    try {
      const response = await fetch('/api/appointment-types')
      if (!response.ok) {
        throw new Error('Failed to fetch appointment types')
      }
      const data = await response.json()
      // Ensure data is an array
      if (Array.isArray(data)) {
        setAppointmentTypes(data)
      } else {
        console.error('Unexpected data format:', data)
        setAppointmentTypes([])
      }
    } catch (error) {
      console.error('Error fetching appointment types:', error)
      toast.error('Fehler beim Laden der Termintypen')
      setAppointmentTypes([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newType.name || newType.durationMinutes < 15) {
      toast.error('Bitte geben Sie einen Namen und eine Dauer von mindestens 15 Minuten ein')
      return
    }

    try {
      const response = await fetch('/api/appointment-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType)
      })

      if (!response.ok) throw new Error()

      const created = await response.json()
      setAppointmentTypes([...appointmentTypes, created])
      setNewType({ name: '', durationMinutes: 60, description: '' })
      toast.success('Termintyp erstellt')
    } catch (error) {
      toast.error('Fehler beim Erstellen des Termintyps')
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch('/api/appointment-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm })
      })

      if (!response.ok) throw new Error()

      const updated = await response.json()
      setAppointmentTypes(appointmentTypes.map(t => t.id === id ? updated : t))
      setEditingId(null)
      toast.success('Termintyp aktualisiert')
    } catch (error) {
      toast.error('Fehler beim Aktualisieren')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Termintyp wirklich löschen?')) return

    try {
      const response = await fetch(`/api/appointment-types?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error()

      setAppointmentTypes(appointmentTypes.filter(t => t.id !== id))
      toast.success('Termintyp gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

  const startEdit = (type: AppointmentType) => {
    setEditingId(type.id)
    setEditForm({
      name: type.name,
      durationMinutes: type.durationMinutes,
      description: type.description || ''
    })
  }

  if (!mounted || loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Termintypen verwalten
      </h3>

      {/* New appointment type form */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium mb-3">Neuen Termintyp erstellen</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            type="text"
            placeholder="Name"
            value={newType.name}
            onChange={(e) => setNewType({ ...newType, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Dauer (Min)"
            min="15"
            step="15"
            value={newType.durationMinutes}
            onChange={(e) => setNewType({ ...newType, durationMinutes: parseInt(e.target.value) || 0 })}
          />
          <Input
            type="text"
            placeholder="Beschreibung (optional)"
            value={newType.description}
            onChange={(e) => setNewType({ ...newType, description: e.target.value })}
          />
          <Button
            onClick={handleCreate}
            className="w-full"
          >
            <Plus className="w-4 h-4" />
            Erstellen
          </Button>
        </div>
      </div>

      {/* Appointment types list */}
      <div className="space-y-2">
        {appointmentTypes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Noch keine Termintypen erstellt
          </p>
        ) : (
          appointmentTypes.map(type => (
            <div
              key={type.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              {editingId === type.id ? (
                <>
                  <Input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={editForm.durationMinutes}
                    onChange={(e) => setEditForm({ ...editForm, durationMinutes: parseInt(e.target.value) || 0 })}
                    className="w-20"
                  />
                  <Button
                    onClick={() => handleUpdate(type.id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setEditingId(null)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium">{type.name}</p>
                    {type.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {type.durationMinutes} Min
                  </span>
                  <Button
                    onClick={() => startEdit(type)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(type.id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}