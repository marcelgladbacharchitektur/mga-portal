import { useState } from 'react'
import { Plus, Edit2, Trash2, User } from 'lucide-react'
import { Modal } from '@/components/modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { Contact, ContactGroup } from '@/types'

type ContactWithGroup = Contact & {
  contactGroup: ContactGroup | null
}

interface ContactsListProps {
  contacts: ContactWithGroup[]
  loading: boolean
  onUpdate: () => void
}

export default function ContactsList({ contacts, loading, onUpdate }: ContactsListProps) {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactWithGroup | null>(null)
  const [deletingContact, setDeletingContact] = useState<ContactWithGroup | null>(null)

  const handleCreate = async (data: any) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Fehler beim Erstellen der Person')
      }

      toast.success('Person erfolgreich erstellt')
      setShowCreateModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error creating contact:', error)
      toast.error('Fehler beim Erstellen der Person')
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingContact) return

    try {
      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Fehler beim Aktualisieren der Person')

      toast.success('Person erfolgreich aktualisiert')
      setEditingContact(null)
      onUpdate()
    } catch (error) {
      console.error('Error updating contact:', error)
      toast.error('Fehler beim Aktualisieren der Person')
    }
  }

  const handleDelete = async () => {
    if (!deletingContact) return

    try {
      const response = await fetch(`/api/contacts/${deletingContact.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Fehler beim Löschen der Person')

      toast.success('Person erfolgreich gelöscht')
      setDeletingContact(null)
      onUpdate()
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Fehler beim Löschen der Person')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          {contacts.length} {contacts.length === 1 ? 'Person' : 'Personen'}
        </p>
        <Button
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          Neue Person
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Noch keine Personen
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Erstellen Sie Ihre erste Person, um Kontakte zu verwalten.
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Neue Person
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              title="Doppelklick für Schnellansicht"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {contact.firstName} {contact.lastName}
                  </h3>
                  {contact.contactGroup && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {contact.contactGroup.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingContact(contact)
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingContact(contact)
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {contact.email && (
                  <p>Email: {contact.email}</p>
                )}
                {contact.phone && (
                  <p>Telefon: {contact.phone}</p>
                )}
                {contact.company && (
                  <p>Firma: {contact.company}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingContact) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowCreateModal(false)
            setEditingContact(null)
          }}
          title={editingContact ? 'Person bearbeiten' : 'Neue Person'}
        >
          <ContactForm
            contact={editingContact}
            onSubmit={editingContact ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowCreateModal(false)
              setEditingContact(null)
            }}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingContact && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingContact(null)}
          title="Person löschen"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Sind Sie sicher, dass Sie <strong className="text-gray-900 dark:text-gray-100">
                {deletingContact.firstName} {deletingContact.lastName}
              </strong> löschen möchten?
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setDeletingContact(null)}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1"
              >
                Endgültig löschen
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}

interface ContactFormProps {
  contact?: ContactWithGroup | null
  onSubmit: (data: any) => void
  onCancel: () => void
}

function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
  const [formData, setFormData] = useState({
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    company: contact?.company || '',
    notes: contact?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vorname *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nachname *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          E-Mail
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Telefon
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Firma
        </label>
        <input
          type="text"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notizen
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Abbrechen
        </Button>
        <Button
          type="submit"
          className="flex-1"
        >
          {contact ? 'Speichern' : 'Erstellen'}
        </Button>
      </div>
    </form>
  )
}