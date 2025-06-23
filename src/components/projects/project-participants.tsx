'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Users } from 'lucide-react'
import { Modal } from '@/components/modal'
import { toast } from 'sonner'
import type { ContactGroup, ProjectParticipant } from '@/types'

type ParticipantWithGroup = ProjectParticipant & {
  contactGroup: ContactGroup
}

interface ProjectParticipantsProps {
  projectId: string
}

export function ProjectParticipants({ projectId }: ProjectParticipantsProps) {
  const [participants, setParticipants] = useState<ParticipantWithGroup[]>([])
  const [availableGroups, setAvailableGroups] = useState<ContactGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [role, setRole] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [participantsRes, groupsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/participants`),
        fetch('/api/contact-groups')
      ])

      if (!participantsRes.ok || !groupsRes.ok) {
        throw new Error('Fehler beim Laden der Daten')
      }

      const [participantsData, groupsData] = await Promise.all([
        participantsRes.json(),
        groupsRes.json()
      ])

      setParticipants(participantsData)
      setAvailableGroups(groupsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleAddParticipant = async () => {
    if (!selectedGroup || !role.trim()) {
      toast.error('Bitte wählen Sie eine Gruppe und geben Sie eine Rolle ein')
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactGroupId: selectedGroup,
          role: role.trim()
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Hinzufügen des Teilnehmers')
      }

      toast.success('Teilnehmer erfolgreich hinzugefügt')
      setShowAddModal(false)
      setSelectedGroup('')
      setRole('')
      setSearchTerm('')
      fetchData()
    } catch (error) {
      console.error('Error adding participant:', error)
      toast.error(error instanceof Error ? error.message : 'Fehler beim Hinzufügen des Teilnehmers')
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/participants/${participantId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Fehler beim Entfernen des Teilnehmers')
      }

      toast.success('Teilnehmer erfolgreich entfernt')
      fetchData()
    } catch (error) {
      console.error('Error removing participant:', error)
      toast.error('Fehler beim Entfernen des Teilnehmers')
    }
  }

  const filteredGroups = availableGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Bereits zugewiesene Gruppen filtern
  const assignedGroupIds = participants.map(p => p.contactGroupId)
  const availableForAssignment = filteredGroups.filter(g => !assignedGroupIds.includes(g.id))

  const categoryColors: Record<string, string> = {
    'Bauherr': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Planer': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Handwerker': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Sonstige': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Users className="w-5 h-5" />
            Projektteilnehmer ({participants.length})
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Teilnehmer hinzufügen
          </button>
        </div>
      </div>

      <div className="p-6">
        {participants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Noch keine Teilnehmer zugewiesen
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ersten Teilnehmer hinzufügen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {participant.contactGroup.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryColors[participant.contactGroup.category] || categoryColors['Sonstige']}`}>
                        {participant.contactGroup.category}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        als {participant.role}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveParticipant(participant.id)}
                  className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  title="Teilnehmer entfernen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowAddModal(false)
            setSelectedGroup('')
            setRole('')
            setSearchTerm('')
          }}
          title="Teilnehmer hinzufügen"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gruppe auswählen *
              </label>
              <input
                type="text"
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-2"
              />
              {availableForAssignment.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                  {searchTerm ? 'Keine passenden Gruppen gefunden' : 'Alle Gruppen sind bereits zugewiesen'}
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableForAssignment.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <input
                        type="radio"
                        name="group"
                        value={group.id}
                        checked={selectedGroup === group.id}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {group.name}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${categoryColors[group.category] || categoryColors['Sonstige']}`}>
                          {group.category}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rolle im Projekt *
              </label>
              <input
                type="text"
                placeholder="z.B. Bauherr, Statiker, Elektriker..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Beschreiben Sie die Rolle dieser Gruppe in diesem spezifischen Projekt
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedGroup('')
                  setRole('')
                  setSearchTerm('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddParticipant}
                disabled={!selectedGroup || !role.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}