import { useState } from 'react'
import { Plus, Edit2, Trash2, Users, ChevronRight } from 'lucide-react'
import { Modal } from '@/components/modal'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Contact, ContactGroup } from '@/types'

type GroupWithContacts = ContactGroup & {
  contacts: Contact[]
}

interface GroupsListProps {
  groups: GroupWithContacts[]
  loading: boolean
  onUpdate: () => void
}

export default function GroupsList({ groups, loading, onUpdate }: GroupsListProps) {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<GroupWithContacts | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<GroupWithContacts | null>(null)

  const handleCreate = async (data: any) => {
    try {
      const response = await fetch('/api/contact-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Fehler beim Erstellen der Gruppe')

      toast.success('Gruppe erfolgreich erstellt')
      setShowCreateModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Fehler beim Erstellen der Gruppe')
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingGroup) return

    try {
      const response = await fetch(`/api/contact-groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Fehler beim Aktualisieren der Gruppe')

      toast.success('Gruppe erfolgreich aktualisiert')
      setEditingGroup(null)
      onUpdate()
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error('Fehler beim Aktualisieren der Gruppe')
    }
  }

  const handleDelete = async () => {
    if (!deletingGroup) return

    try {
      const response = await fetch(`/api/contact-groups/${deletingGroup.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Fehler beim Löschen der Gruppe')

      toast.success('Gruppe erfolgreich gelöscht')
      setDeletingGroup(null)
      onUpdate()
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Fehler beim Löschen der Gruppe')
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
          {groups.length} {groups.length === 1 ? 'Gruppe' : 'Gruppen'}
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neue Gruppe
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Noch keine Gruppen
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Erstellen Sie Ihre erste Gruppe, um Kontakte zu organisieren.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neue Gruppe
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              onDoubleClick={() => router.push(`/contacts/groups/${group.id}`)}
              title="Doppelklick für Details"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {group.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${categoryColors[group.category] || categoryColors['Sonstige']}`}>
                    {group.category}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingGroup(group)}
                    className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingGroup(group)}
                    className="p-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {group.contacts.length} {group.contacts.length === 1 ? 'Mitglied' : 'Mitglieder'}
                </p>
                <Link
                  href={`/contacts/groups/${group.id}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Mitglieder verwalten
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingGroup) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowCreateModal(false)
            setEditingGroup(null)
          }}
          title={editingGroup ? 'Gruppe bearbeiten' : 'Neue Gruppe'}
        >
          <GroupForm
            group={editingGroup}
            onSubmit={editingGroup ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowCreateModal(false)
              setEditingGroup(null)
            }}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingGroup && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingGroup(null)}
          title="Gruppe löschen"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Sind Sie sicher, dass Sie die Gruppe <strong className="text-gray-900 dark:text-gray-100">
                {deletingGroup.name}
              </strong> löschen möchten?
            </p>
            {deletingGroup.contacts.length > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Diese Gruppe hat {deletingGroup.contacts.length} {deletingGroup.contacts.length === 1 ? 'Mitglied' : 'Mitglieder'}.
              </p>
            )}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setDeletingGroup(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

interface GroupFormProps {
  group?: GroupWithContacts | null
  onSubmit: (data: any) => void
  onCancel: () => void
}

function GroupForm({ group, onSubmit, onCancel }: GroupFormProps) {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    category: group?.category || 'Bauherr',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Kategorie *
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        >
          <option value="Bauherr">Bauherr</option>
          <option value="Planer">Planer</option>
          <option value="Handwerker">Handwerker</option>
          <option value="Sonstige">Sonstige</option>
        </select>
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
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {group ? 'Speichern' : 'Erstellen'}
        </button>
      </div>
    </form>
  )
}