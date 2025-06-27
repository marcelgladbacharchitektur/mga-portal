import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X, Users, User, FolderOpen } from 'lucide-react'
import type { Project, ContactGroup, Contact } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AppointmentFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface Participant {
  type: 'person' | 'contactGroup' | 'project'
  id: string
  name: string
}

export function AppointmentForm({ onSuccess, onCancel }: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '',
    location: '',
    notes: '',
  })
  
  const [participants, setParticipants] = useState<Participant[]>([])
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [participantType, setParticipantType] = useState<'person' | 'contactGroup' | 'project'>('person')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [projects, setProjects] = useState<Project[]>([])
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, groupsRes, contactsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/contact-groups'),
        fetch('/api/contacts')
      ])

      if (!projectsRes.ok || !groupsRes.ok || !contactsRes.ok) {
        throw new Error('Fehler beim Laden der Daten')
      }

      const [projectsData, groupsData, contactsData] = await Promise.all([
        projectsRes.json(),
        groupsRes.json(),
        contactsRes.json()
      ])

      setProjects(projectsData)
      setContactGroups(groupsData)
      setContacts(contactsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Fehler beim Laden der Daten')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

      if (endDateTime <= startDateTime) {
        throw new Error('Endzeit muss nach Startzeit liegen')
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: formData.location || null,
          notes: formData.notes || null,
          participants: participants.map(p => ({
            participantType: p.type,
            participantId: p.id
          }))
        }),
      })

      if (!response.ok) throw new Error('Fehler beim Erstellen des Termins')

      toast.success('Termin erfolgreich erstellt')
      onSuccess()
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error(error instanceof Error ? error.message : 'Fehler beim Erstellen des Termins')
    } finally {
      setLoading(false)
    }
  }

  const addParticipant = (type: string, id: string, name: string) => {
    const exists = participants.some(p => p.type === type && p.id === id)
    if (!exists) {
      setParticipants([...participants, { type: type as any, id, name }])
    }
    setShowAddParticipant(false)
    setSearchTerm('')
  }

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const getFilteredOptions = () => {
    const term = searchTerm.toLowerCase()
    
    switch (participantType) {
      case 'person':
        return contacts
          .filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(term) ||
            (c.company?.toLowerCase().includes(term) ?? false)
          )
          .slice(0, 10)
      
      case 'contactGroup':
        return contactGroups
          .filter(g => g.name.toLowerCase().includes(term))
          .slice(0, 10)
      
      case 'project':
        return projects
          .filter(p => 
            p.name.toLowerCase().includes(term) ||
            p.projectNumber.toLowerCase().includes(term)
          )
          .slice(0, 10)
      
      default:
        return []
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Grunddaten */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Titel *</Label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="z.B. Besprechung Projektstand"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Beschreibung</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            placeholder="Worum geht es in diesem Termin?"
          />
        </div>
      </div>

      {/* Zeit */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Zeit</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Startdatum *</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Startzeit *</Label>
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
            <Label>Enddatum *</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Endzeit *</Label>
            <Input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Ort */}
      <div className="space-y-2">
        <Label>Ort</Label>
        <Input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="z.B. Büro, Baustelle, Online"
        />
      </div>

      {/* Teilnehmer */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Teilnehmer</h3>
          <button
            type="button"
            onClick={() => setShowAddParticipant(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Teilnehmer hinzufügen
          </button>
        </div>

        {participants.length > 0 ? (
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {participant.type === 'person' && <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                  {participant.type === 'contactGroup' && <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                  {participant.type === 'project' && <FolderOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {participant.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({participant.type === 'person' ? 'Person' : participant.type === 'contactGroup' ? 'Gruppe' : 'Projekt'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="p-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
            Noch keine Teilnehmer hinzugefügt
          </p>
        )}

        {showAddParticipant && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setParticipantType('person')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  participantType === 'person'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Person
              </button>
              <button
                type="button"
                onClick={() => setParticipantType('contactGroup')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  participantType === 'contactGroup'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Gruppe
              </button>
              <button
                type="button"
                onClick={() => setParticipantType('project')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  participantType === 'project'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Projekt
              </button>
            </div>

            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Nach ${participantType === 'person' ? 'Person' : participantType === 'contactGroup' ? 'Gruppe' : 'Projekt'} suchen...`}
            />

            <div className="max-h-48 overflow-y-auto space-y-1">
              {getFilteredOptions().map((option: any) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    const name = participantType === 'person' 
                      ? `${option.firstName} ${option.lastName}`
                      : participantType === 'project'
                      ? `${option.projectNumber} - ${option.name}`
                      : option.name
                    addParticipant(participantType, option.id, name)
                  }}
                  className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {participantType === 'person' && `${option.firstName} ${option.lastName}`}
                    {participantType === 'contactGroup' && option.name}
                    {participantType === 'project' && `${option.projectNumber} - ${option.name}`}
                  </span>
                  {participantType === 'person' && option.company && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({option.company})
                    </span>
                  )}
                  {participantType === 'contactGroup' && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({option.category})
                    </span>
                  )}
                </button>
              ))}
              {getFilteredOptions().length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  Keine Ergebnisse gefunden
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddParticipant(false)
                setSearchTerm('')
              }}
              className="w-full px-3 py-1 text-sm text-gray-700 dark:text-gray-300"
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>

      {/* Notizen */}
      <div className="space-y-2">
        <Label>Notizen</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          placeholder="Zusätzliche Informationen zum Termin"
        />
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
          disabled={loading || !formData.title || !formData.startTime || !formData.endTime}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Erstelle...' : 'Erstellen'}
        </button>
      </div>
    </form>
  )
}