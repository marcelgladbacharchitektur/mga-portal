'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EmailAddress {
  id?: string
  email: string
  emailType: 'WORK' | 'PRIVATE' | 'OTHER'
  isPrimary: boolean
}

interface PhoneNumber {
  id?: string
  number: string
  phoneType: 'WORK' | 'MOBILE' | 'FAX' | 'PRIVATE' | 'OTHER'
  isPrimary: boolean
}

interface Address {
  id?: string
  street: string
  streetNumber: string
  postalCode: string
  city: string
  country: string
  addressType: 'BUSINESS' | 'PRIVATE' | 'BILLING' | 'SHIPPING'
  isPrimary: boolean
}

interface PersonData {
  firstName: string
  lastName: string
  title?: string
  position?: string
  department?: string
  contactGroupId?: string
  emails: EmailAddress[]
  phones: PhoneNumber[]
  addresses: Address[]
}

export default function EditPersonPage() {
  const params = useParams()
  const router = useRouter()
  const personId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<PersonData>({
    firstName: '',
    lastName: '',
    title: '',
    position: '',
    department: '',
    contactGroupId: '',
    emails: [],
    phones: [],
    addresses: []
  })
  
  const [groups, setGroups] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [personId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch person data
      const personRes = await fetch(`/api/persons/${personId}`)
      if (!personRes.ok) {
        throw new Error('Person nicht gefunden')
      }
      const personData = await personRes.json()
      
      // Fetch groups for dropdown
      const groupsRes = await fetch('/api/contact-groups')
      const groupsData = await groupsRes.json()
      setGroups(groupsData)
      
      // Set form data
      setFormData({
        firstName: personData.firstName || '',
        lastName: personData.lastName || '',
        title: personData.title || '',
        position: personData.position || '',
        department: personData.department || '',
        contactGroupId: personData.contactGroupId || '',
        emails: personData.EmailAddress || [],
        phones: personData.PhoneNumber || [],
        addresses: personData.Address || []
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Fehler beim Laden der Daten')
      router.push('/contacts')
    } finally {
      setLoading(false)
    }
  }

  const addEmail = () => {
    setFormData({
      ...formData,
      emails: [...formData.emails, { email: '', emailType: 'WORK', isPrimary: formData.emails.length === 0 }]
    })
  }

  const removeEmail = (index: number) => {
    const newEmails = formData.emails.filter((_, i) => i !== index)
    // Ensure at least one is primary
    if (newEmails.length > 0 && !newEmails.some(e => e.isPrimary)) {
      newEmails[0].isPrimary = true
    }
    setFormData({ ...formData, emails: newEmails })
  }

  const updateEmail = (index: number, field: keyof EmailAddress, value: any) => {
    const newEmails = [...formData.emails]
    newEmails[index] = { ...newEmails[index], [field]: value }
    
    // If setting as primary, unset others
    if (field === 'isPrimary' && value) {
      newEmails.forEach((e, i) => {
        if (i !== index) e.isPrimary = false
      })
    }
    
    setFormData({ ...formData, emails: newEmails })
  }

  const addPhone = () => {
    setFormData({
      ...formData,
      phones: [...formData.phones, { number: '', phoneType: 'MOBILE', isPrimary: formData.phones.length === 0 }]
    })
  }

  const removePhone = (index: number) => {
    const newPhones = formData.phones.filter((_, i) => i !== index)
    if (newPhones.length > 0 && !newPhones.some(p => p.isPrimary)) {
      newPhones[0].isPrimary = true
    }
    setFormData({ ...formData, phones: newPhones })
  }

  const updatePhone = (index: number, field: keyof PhoneNumber, value: any) => {
    const newPhones = [...formData.phones]
    newPhones[index] = { ...newPhones[index], [field]: value }
    
    if (field === 'isPrimary' && value) {
      newPhones.forEach((p, i) => {
        if (i !== index) p.isPrimary = false
      })
    }
    
    setFormData({ ...formData, phones: newPhones })
  }

  const addAddress = () => {
    setFormData({
      ...formData,
      addresses: [...formData.addresses, {
        street: '',
        streetNumber: '',
        postalCode: '',
        city: '',
        country: 'Deutschland',
        addressType: 'BUSINESS',
        isPrimary: formData.addresses.length === 0
      }]
    })
  }

  const removeAddress = (index: number) => {
    const newAddresses = formData.addresses.filter((_, i) => i !== index)
    if (newAddresses.length > 0 && !newAddresses.some(a => a.isPrimary)) {
      newAddresses[0].isPrimary = true
    }
    setFormData({ ...formData, addresses: newAddresses })
  }

  const updateAddress = (index: number, field: keyof Address, value: any) => {
    const newAddresses = [...formData.addresses]
    newAddresses[index] = { ...newAddresses[index], [field]: value }
    
    if (field === 'isPrimary' && value) {
      newAddresses.forEach((a, i) => {
        if (i !== index) a.isPrimary = false
      })
    }
    
    setFormData({ ...formData, addresses: newAddresses })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName) {
      toast.error('Vor- und Nachname sind erforderlich')
      return
    }
    
    setSaving(true)
    
    try {
      const response = await fetch(`/api/persons/${personId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        throw new Error('Fehler beim Speichern')
      }
      
      toast.success('Person erfolgreich aktualisiert')
      router.push(`/contacts/persons/${personId}`)
    } catch (error) {
      console.error('Error saving person:', error)
      toast.error('Fehler beim Speichern der Person')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex items-center space-x-4">
        <Link
          href={`/contacts/persons/${personId}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold">Person bearbeiten</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Grundinformationen</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Anrede</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Dr., Prof., etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gruppe</label>
              <Select
                value={formData.contactGroupId || "none"}
                onValueChange={(value) => setFormData({ ...formData, contactGroupId: value === "none" ? "" : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Keine Gruppe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Gruppe</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vorname *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nachname *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="z.B. Geschäftsführer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Abteilung</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="z.B. Vertrieb"
              />
            </div>
          </div>
        </div>

        {/* Email Addresses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">E-Mail-Adressen</h2>
            <button
              type="button"
              onClick={addEmail}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Hinzufügen</span>
            </button>
          </div>
          <div className="space-y-3">
            {formData.emails.map((email, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="email"
                  value={email.email}
                  onChange={(e) => updateEmail(index, 'email', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="email@example.com"
                  required
                />
                <Select
                  value={email.emailType}
                  onValueChange={(value) => updateEmail(index, 'emailType', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WORK">Arbeit</SelectItem>
                    <SelectItem value="PRIVATE">Privat</SelectItem>
                    <SelectItem value="OTHER">Andere</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={email.isPrimary}
                    onChange={(e) => updateEmail(index, 'isPrimary', e.target.checked)}
                    className="mr-2"
                  />
                  Primär
                </label>
                <button
                  type="button"
                  onClick={() => removeEmail(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {formData.emails.length === 0 && (
              <p className="text-gray-500 text-center py-4">Keine E-Mail-Adressen vorhanden</p>
            )}
          </div>
        </div>

        {/* Phone Numbers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Telefonnummern</h2>
            <button
              type="button"
              onClick={addPhone}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Hinzufügen</span>
            </button>
          </div>
          <div className="space-y-3">
            {formData.phones.map((phone, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="tel"
                  value={phone.number}
                  onChange={(e) => updatePhone(index, 'number', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="+43 123 456789"
                  required
                />
                <Select
                  value={phone.phoneType}
                  onValueChange={(value) => updatePhone(index, 'phoneType', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOBILE">Mobil</SelectItem>
                    <SelectItem value="WORK">Arbeit</SelectItem>
                    <SelectItem value="FAX">Fax</SelectItem>
                    <SelectItem value="PRIVATE">Privat</SelectItem>
                    <SelectItem value="OTHER">Andere</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={phone.isPrimary}
                    onChange={(e) => updatePhone(index, 'isPrimary', e.target.checked)}
                    className="mr-2"
                  />
                  Primär
                </label>
                <button
                  type="button"
                  onClick={() => removePhone(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {formData.phones.length === 0 && (
              <p className="text-gray-500 text-center py-4">Keine Telefonnummern vorhanden</p>
            )}
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Adressen</h2>
            <button
              type="button"
              onClick={addAddress}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Hinzufügen</span>
            </button>
          </div>
          <div className="space-y-4">
            {formData.addresses.map((address, index) => (
              <div key={index} className="border rounded-lg p-4 dark:border-gray-600">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="md:col-span-2 flex items-center justify-between">
                    <Select
                      value={address.addressType}
                      onValueChange={(value) => updateAddress(index, 'addressType', value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUSINESS">Geschäft</SelectItem>
                        <SelectItem value="PRIVATE">Privat</SelectItem>
                        <SelectItem value="BILLING">Rechnung</SelectItem>
                        <SelectItem value="SHIPPING">Versand</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={address.isPrimary}
                          onChange={(e) => updateAddress(index, 'isPrimary', e.target.checked)}
                          className="mr-2"
                        />
                        Primär
                      </label>
                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => updateAddress(index, 'street', e.target.value)}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Straße"
                    required
                  />
                  <input
                    type="text"
                    value={address.streetNumber}
                    onChange={(e) => updateAddress(index, 'streetNumber', e.target.value)}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Nr."
                    required
                  />
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="PLZ"
                    required
                  />
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => updateAddress(index, 'city', e.target.value)}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Stadt"
                    required
                  />
                  <input
                    type="text"
                    value={address.country}
                    onChange={(e) => updateAddress(index, 'country', e.target.value)}
                    className="md:col-span-2 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Land"
                    required
                  />
                </div>
              </div>
            ))}
            {formData.addresses.length === 0 && (
              <p className="text-gray-500 text-center py-4">Keine Adressen vorhanden</p>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href={`/contacts/persons/${personId}`}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Speichern...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Speichern</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}