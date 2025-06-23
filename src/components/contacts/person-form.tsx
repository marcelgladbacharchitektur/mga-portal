import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
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

interface PersonFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface EmailEntry {
  email: string
  type: 'work' | 'private' | 'other'
  isPrimary: boolean
}

interface PhoneEntry {
  number: string
  type: 'work' | 'mobile' | 'private' | 'other'
  isPrimary: boolean
}

interface AddressEntry {
  street: string
  postalCode: string
  city: string
  type: 'work' | 'private' | 'other'
  isPrimary: boolean
}

export function PersonForm({ onSuccess, onCancel }: PersonFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    position: '',
    company: '',
    department: '',
    notes: '',
  })
  
  const [emails, setEmails] = useState<EmailEntry[]>([{ email: '', type: 'work', isPrimary: true }])
  const [phones, setPhones] = useState<PhoneEntry[]>([{ number: '', type: 'work', isPrimary: true }])
  const [addresses, setAddresses] = useState<AddressEntry[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const filteredEmails = emails.filter(e => e.email)
      const filteredPhones = phones.filter(p => p.number)
      
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          emails: filteredEmails,
          phones: filteredPhones,
          addresses
        }),
      })

      if (!response.ok) throw new Error('Fehler beim Erstellen der Person')

      toast.success('Person erfolgreich erstellt')
      onSuccess()
    } catch (error) {
      console.error('Error creating person:', error)
      toast.error('Fehler beim Erstellen der Person')
    } finally {
      setLoading(false)
    }
  }

  const addEmail = () => {
    setEmails([...emails, { email: '', type: 'work', isPrimary: false }])
  }

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }

  const updateEmail = (index: number, field: keyof EmailEntry, value: any) => {
    const updated = [...emails]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'isPrimary' && value) {
      updated.forEach((e, i) => {
        if (i !== index) e.isPrimary = false
      })
    }
    setEmails(updated)
  }

  const addPhone = () => {
    setPhones([...phones, { number: '', type: 'mobile', isPrimary: false }])
  }

  const removePhone = (index: number) => {
    setPhones(phones.filter((_, i) => i !== index))
  }

  const updatePhone = (index: number, field: keyof PhoneEntry, value: any) => {
    const updated = [...phones]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'isPrimary' && value) {
      updated.forEach((p, i) => {
        if (i !== index) p.isPrimary = false
      })
    }
    setPhones(updated)
  }

  const addAddress = () => {
    setAddresses([...addresses, { street: '', postalCode: '', city: '', type: 'work', isPrimary: false }])
  }

  const removeAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index))
  }

  const updateAddress = (index: number, field: keyof AddressEntry, value: any) => {
    const updated = [...addresses]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'isPrimary' && value) {
      updated.forEach((a, i) => {
        if (i !== index) a.isPrimary = false
      })
    }
    setAddresses(updated)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Grunddaten */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Grunddaten</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Titel</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Dr., Prof., etc."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Vorname *</Label>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nachname *</Label>
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Firma</Label>
            <Input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Geschäftsführer, Projektleiter, etc."
            />
          </div>
        </div>
      </div>

      {/* E-Mail-Adressen */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">E-Mail-Adressen</h3>
          <button
            type="button"
            onClick={addEmail}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            E-Mail hinzufügen
          </button>
        </div>
        {emails.map((email, index) => (
          <div key={index} className="flex gap-2 items-start">
            <Input
              type="email"
              value={email.email}
              onChange={(e) => updateEmail(index, 'email', e.target.value)}
              placeholder="email@beispiel.de"
              className="flex-1"
            />
            <Select
              value={email.type}
              onValueChange={(value) => updateEmail(index, 'type', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work">Arbeit</SelectItem>
                <SelectItem value="private">Privat</SelectItem>
                <SelectItem value="other">Sonstige</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={email.isPrimary}
                onChange={(e) => updateEmail(index, 'isPrimary', e.target.checked)}
              />
              <span className="text-sm">Primär</span>
            </label>
            {emails.length > 1 && (
              <button
                type="button"
                onClick={() => removeEmail(index)}
                className="p-2 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Telefonnummern */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Telefonnummern</h3>
          <button
            type="button"
            onClick={addPhone}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Telefon hinzufügen
          </button>
        </div>
        {phones.map((phone, index) => (
          <div key={index} className="flex gap-2 items-start">
            <Input
              type="tel"
              value={phone.number}
              onChange={(e) => updatePhone(index, 'number', e.target.value)}
              placeholder="+49 123 456789"
              className="flex-1"
            />
            <Select
              value={phone.type}
              onValueChange={(value) => updatePhone(index, 'type', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work">Arbeit</SelectItem>
                <SelectItem value="mobile">Mobil</SelectItem>
                <SelectItem value="private">Privat</SelectItem>
                <SelectItem value="other">Sonstige</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={phone.isPrimary}
                onChange={(e) => updatePhone(index, 'isPrimary', e.target.checked)}
              />
              <span className="text-sm">Primär</span>
            </label>
            {phones.length > 1 && (
              <button
                type="button"
                onClick={() => removePhone(index)}
                className="p-2 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Adressen */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Adressen</h3>
          <button
            type="button"
            onClick={addAddress}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Adresse hinzufügen
          </button>
        </div>
        {addresses.map((address, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input
                    type="text"
                    value={address.street}
                    onChange={(e) => updateAddress(index, 'street', e.target.value)}
                    placeholder="Straße und Hausnummer"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
                    placeholder="PLZ"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    value={address.city}
                    onChange={(e) => updateAddress(index, 'city', e.target.value)}
                    placeholder="Stadt"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAddress(index)}
                className="ml-2 p-2 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4 items-center">
              <Select
                value={address.type}
                onValueChange={(value) => updateAddress(index, 'type', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Arbeit</SelectItem>
                  <SelectItem value="private">Privat</SelectItem>
                  <SelectItem value="other">Sonstige</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={address.isPrimary}
                  onChange={(e) => updateAddress(index, 'isPrimary', e.target.checked)}
                />
                <span className="text-sm">Primär</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Notizen */}
      <div className="space-y-2">
        <Label>Notizen</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
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
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Erstelle...' : 'Erstellen'}
        </button>
      </div>
    </form>
  )
}