'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, User } from 'lucide-react'
import { Modal } from '@/components/modal'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Contact, ContactGroup } from '@/types'

type GroupWithContacts = ContactGroup & {
  contacts: Contact[]
}

type ContactWithGroup = Contact & {
  contactGroup: ContactGroup | null
}

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithContacts | null>(null)
  const [availableContacts, setAvailableContacts] = useState<ContactWithGroup[]>([])
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [groupRes, contactsRes] = await Promise.all([
        fetch(`/api/contact-groups/${params.id}`),
        fetch('/api/contacts')
      ])

      if (!groupRes.ok) {
        throw new Error('Gruppe nicht gefunden')
      }

      const [groupData, contactsData] = await Promise.all([
        groupRes.json(),
        contactsRes.json()
      ])

      setGroup(groupData)
      
      // Filtere Kontakte, die noch nicht in einer Gruppe sind
      const unassignedContacts = contactsData.filter((contact: ContactWithGroup) => !contact.contactGroup)
      setAvailableContacts(unassignedContacts)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Fehler beim Laden der Daten')
      router.push('/contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMembers = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Bitte wählen Sie mindestens eine Person aus')
      return
    }

    try {
      const response = await fetch(`/api/contact-groups/${params.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: selectedContacts }),
      })

      if (!response.ok) throw new Error('Fehler beim Hinzufügen der Mitglieder')

      toast.success('Mitglieder erfolgreich hinzugefügt')
      setShowAddMemberModal(false)
      setSelectedContacts([])
      fetchData()
    } catch (error) {
      console.error('Error adding members:', error)
      toast.error('Fehler beim Hinzufügen der Mitglieder')
    }
  }

  const handleRemoveMember = async (contactId: string) => {
    try {
      const response = await fetch(`/api/contact-groups/${params.id}/members/${contactId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Fehler beim Entfernen des Mitglieds')

      toast.success('Mitglied erfolgreich entfernt')
      fetchData()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Fehler beim Entfernen des Mitglieds')
    }
  }

  const categoryColors: Record<string, string> = {
    'Bauherr': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Planer': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Handwerker': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Sonstige': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!group) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zu Kontakte
        </Link>
        
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${categoryColors[group.category] || categoryColors['Sonstige']}`}>
            {group.category}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">
              Mitglieder ({group.contacts.length})
            </h2>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Mitglied hinzufügen
            </button>
          </div>
        </div>

        <div className="p-6">
          {group.contacts.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Diese Gruppe hat noch keine Mitglieder
              </p>
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Erstes Mitglied hinzufügen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {group.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    <div className="flex gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {contact.email && <p>Email: {contact.email}</p>}
                      {contact.phone && <p>Tel: {contact.phone}</p>}
                      {contact.company && <p>Firma: {contact.company}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(contact.id)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowAddMemberModal(false)
            setSelectedContacts([])
          }}
          title="Mitglieder hinzufügen"
        >
          <div className="space-y-4">
            {availableContacts.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                Keine verfügbaren Personen gefunden. Erstellen Sie zuerst neue Personen.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Wählen Sie Personen aus, die Sie dieser Gruppe hinzufügen möchten:
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableContacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        value={contact.id}
                        checked={selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts([...selectedContacts, contact.id])
                          } else {
                            setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
                          }
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.company && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {contact.company}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowAddMemberModal(false)
                  setSelectedContacts([])
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddMembers}
                disabled={selectedContacts.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hinzufügen ({selectedContacts.length})
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}