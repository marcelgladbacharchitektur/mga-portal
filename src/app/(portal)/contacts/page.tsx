'use client'

import { useState, useEffect } from 'react'
import { Tab } from '@headlessui/react'
import { toast } from 'sonner'
import ContactsList from '@/components/contacts/contacts-list'
import GroupsList from '@/components/contacts/groups-list'
import { cn } from '@/lib/utils'
import { SearchInput } from '@/components/search-input'
import { FilterDropdown, FilterOption } from '@/components/filter-dropdown'
import type { Contact, ContactGroup } from '@/types'

type ContactWithGroup = Contact & {
  contactGroup: ContactGroup | null
}

type GroupWithContacts = ContactGroup & {
  contacts: Contact[]
}

const categoryOptions: FilterOption[] = [
  { value: 'BAUHERR', label: 'Bauherr' },
  { value: 'PLANER', label: 'Planer' },
  { value: 'HANDWERKER', label: 'Handwerker' },
  { value: 'BEHOERDE', label: 'Behörde' },
  { value: 'SONSTIGE', label: 'Sonstige' }
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactWithGroup[]>([])
  const [groups, setGroups] = useState<GroupWithContacts[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    fetchData()
  }, [searchQuery, categoryFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (categoryFilter) params.append('category', categoryFilter)
      
      const [contactsRes, groupsRes] = await Promise.all([
        fetch(`/api/contacts?${params.toString()}`),
        fetch('/api/contact-groups')
      ])

      if (!contactsRes.ok) {
        const errorData = await contactsRes.json()
        console.error('Contacts API Error:', errorData)
        throw new Error(errorData.error || 'Fehler beim Laden der Kontakte')
      }
      
      if (!groupsRes.ok) {
        const errorData = await groupsRes.json()
        console.error('Groups API Error:', errorData)
        throw new Error(errorData.error || 'Fehler beim Laden der Gruppen')
      }

      const [contactsData, groupsData] = await Promise.all([
        contactsRes.json(),
        groupsRes.json()
      ])

      setContacts(contactsData)
      setGroups(groupsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleContactUpdate = () => {
    fetchData()
  }

  const handleGroupUpdate = () => {
    fetchData()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Kontakte</h1>

      {/* Such- und Filter-Leiste */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Kontakte suchen..."
          className="flex-1"
        />
        {activeTab === 0 && (
          <FilterDropdown
            label="Kategorie"
            options={categoryOptions}
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value as string)}
          />
        )}
      </div>

      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-8">
          <Tab
            className={({ selected }) =>
              cn(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-900 dark:hover:text-gray-200'
              )
            }
          >
            Personen
          </Tab>
          <Tab
            className={({ selected }) =>
              cn(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-900 dark:hover:text-gray-200'
              )
            }
          >
            Gruppen
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <ContactsList 
              contacts={contacts} 
              loading={loading} 
              onUpdate={handleContactUpdate} 
            />
          </Tab.Panel>
          <Tab.Panel>
            <GroupsList 
              groups={groups} 
              loading={loading} 
              onUpdate={handleGroupUpdate} 
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}