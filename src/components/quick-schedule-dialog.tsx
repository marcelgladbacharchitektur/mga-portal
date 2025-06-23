'use client'

import { useState, useEffect } from 'react'
import { CalendarPlus, X, Copy, Check, Mail, User } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AppointmentType {
  id: string
  name: string
  durationMinutes: number
  description?: string
}

export function QuickScheduleDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    contactId: '',
    customEmail: '',
    customName: '',
    appointmentTypeId: '',
    expiryHours: 48
  })
  
  const [generatedLink, setGeneratedLink] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    try {
      const [contactsRes, typesRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/appointment-types')
      ])
      
      const contactsData = await contactsRes.json()
      const typesData = await typesRes.json()
      
      setContacts(contactsData.contacts || [])
      setAppointmentTypes(typesData)
    } catch (error) {
      toast.error('Fehler beim Laden der Daten')
    }
  }

  const generateBookingLink = async () => {
    setLoading(true)
    
    try {
      // Determine email and name
      let email = formData.customEmail
      let name = formData.customName
      
      if (formData.contactId && formData.contactId !== 'custom') {
        const contact = contacts.find(c => c.id === formData.contactId)
        if (contact) {
          email = contact.email
          name = `${contact.firstName} ${contact.lastName}`
        }
      }
      
      if (!email || !formData.appointmentTypeId) {
        toast.error('Bitte füllen Sie alle Pflichtfelder aus')
        setLoading(false)
        return
      }
      
      // Generate booking token
      const token = typeof window !== 'undefined' && window.crypto 
        ? window.crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + formData.expiryHours)
      
      // Create booking token in database
      const response = await fetch('/api/booking-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          appointmentTypeId: formData.appointmentTypeId,
          contactEmail: email,
          contactName: name,
          expiresAt: expiresAt.toISOString()
        })
      })
      
      if (!response.ok) throw new Error()
      
      // Generate link
      const baseUrl = window.location.origin
      const link = `${baseUrl}/buchung/${token}`
      setGeneratedLink(link)
      
      toast.success('Buchungslink wurde erstellt')
    } catch (error) {
      toast.error('Fehler beim Erstellen des Buchungslinks')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      toast.success('Link wurde kopiert')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Fehler beim Kopieren')
    }
  }

  const reset = () => {
    setFormData({
      contactId: '',
      customEmail: '',
      customName: '',
      appointmentTypeId: '',
      expiryHours: 48
    })
    setGeneratedLink('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title="Schnellbuchung"
      >
        <CalendarPlus className="w-5 h-5" />
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CalendarPlus className="w-6 h-6" />
              Schnellbuchung
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            {!generatedLink ? (
              <>
                {/* Contact selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kontakt auswählen
                  </label>
                  <Select
                    value={formData.contactId || "none"}
                    onValueChange={(value) => setFormData({ ...formData, contactId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Wählen Sie einen Kontakt..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Wählen Sie einen Kontakt...</SelectItem>
                      <SelectItem value="custom">Eigene E-Mail eingeben</SelectItem>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName} ({contact.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Custom email input */}
                {formData.contactId === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        E-Mail-Adresse
                      </label>
                      <input
                        type="email"
                        value={formData.customEmail}
                        onChange={(e) => setFormData({ ...formData, customEmail: e.target.value })}
                        placeholder="kunde@example.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Name (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.customName}
                        onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                        placeholder="Max Mustermann"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      />
                    </div>
                  </>
                )}
                
                {/* Appointment type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Termintyp
                  </label>
                  <Select
                    value={formData.appointmentTypeId || "none"}
                    onValueChange={(value) => setFormData({ ...formData, appointmentTypeId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Wählen Sie einen Termintyp..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Wählen Sie einen Termintyp...</SelectItem>
                      {appointmentTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.durationMinutes} Min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Expiry time */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Link gültig für
                  </label>
                  <Select
                    value={formData.expiryHours.toString()}
                    onValueChange={(value) => setFormData({ ...formData, expiryHours: parseInt(value) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 Stunden</SelectItem>
                      <SelectItem value="48">48 Stunden</SelectItem>
                      <SelectItem value="72">72 Stunden</SelectItem>
                      <SelectItem value="168">1 Woche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Generate button */}
                <button
                  onClick={generateBookingLink}
                  disabled={loading}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Erstelle Link...' : 'Buchungslink generieren'}
                </button>
              </>
            ) : (
              <>
                {/* Generated link */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Ihr persönlicher Buchungslink:</p>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg break-all text-sm">
                      {generatedLink}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Kopiert!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Link kopieren
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={reset}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Neuer Link
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dieser Link ist {formData.expiryHours} Stunden gültig und kann nur einmal verwendet werden.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}