"use client";

import { useState } from "react";
import { AlertCircle, Plus, X, User, Mail, Phone, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  position?: string;
  department?: string;
  emails: EmailAddress[];
  phoneNumbers: PhoneNumber[];
}

interface Address {
  id: string;
  street: string;
  streetNumber?: string;
  postalCode: string;
  city: string;
  country: string;
  addressType: string;
  isPrimary: boolean;
}

interface EmailAddress {
  id: string;
  email: string;
  emailType: string;
  isPrimary: boolean;
}

interface PhoneNumber {
  id: string;
  number: string;
  phoneType: string;
  isPrimary: boolean;
}

interface ContactGroupFormProps {
  mode?: 'create' | 'edit';
  contactGroup?: {
    id: string;
    name: string;
    category: string;
    website?: string | null;
    notes?: string | null;
    Person?: Person[];
    Address?: Address[];
    EmailAddress?: EmailAddress[];
    PhoneNumber?: PhoneNumber[];
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContactGroupForm({ mode = 'create', contactGroup, onSuccess, onCancel }: ContactGroupFormProps) {
  // Basis-Daten
  const [name, setName] = useState(contactGroup?.name || "");
  const [category, setCategory] = useState(contactGroup?.category || "");
  const [website, setWebsite] = useState(contactGroup?.website || "");
  const [notes, setNotes] = useState(contactGroup?.notes || "");
  
  // Verwaltung von Personen, Adressen, E-Mails und Telefonnummern
  const [persons, setPersons] = useState<Person[]>(contactGroup?.Person || []);
  const [addresses, setAddresses] = useState<Address[]>(contactGroup?.Address || []);
  const [groupEmails, setGroupEmails] = useState<EmailAddress[]>(contactGroup?.EmailAddress || []);
  const [groupPhones, setGroupPhones] = useState<PhoneNumber[]>(contactGroup?.PhoneNumber || []);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    { value: "CLIENT", label: "Bauherr" },
    { value: "ARCHITECT", label: "Architekt" },
    { value: "ENGINEER", label: "Ingenieur" },
    { value: "CONTRACTOR", label: "Unternehmer" },
    { value: "AUTHORITY", label: "Behörde" },
    { value: "SUPPLIER", label: "Lieferant" },
    { value: "OTHER", label: "Sonstige" }
  ];

  // Person hinzufügen
  function addPerson() {
    const newPerson: Person = {
      id: `temp-${Date.now()}`,
      firstName: "",
      lastName: "",
      emails: [],
      phoneNumbers: []
    };
    setPersons([...persons, newPerson]);
  }

  // Person entfernen
  function removePerson(personId: string) {
    setPersons(persons.filter(p => p.id !== personId));
  }

  // Person aktualisieren
  function updatePerson(personId: string, updates: Partial<Person>) {
    setPersons(persons.map(p => 
      p.id === personId ? { ...p, ...updates } : p
    ));
  }

  // E-Mail zu Person hinzufügen
  function addEmailToPerson(personId: string) {
    const newEmail: EmailAddress = {
      id: `temp-email-${Date.now()}`,
      email: "",
      emailType: "WORK",
      isPrimary: false
    };
    setPersons(persons.map(p => 
      p.id === personId 
        ? { ...p, emails: [...p.emails, newEmail] }
        : p
    ));
  }

  // Telefon zu Person hinzufügen
  function addPhoneToPerson(personId: string) {
    const newPhone: PhoneNumber = {
      id: `temp-phone-${Date.now()}`,
      number: "",
      phoneType: "WORK",
      isPrimary: false
    };
    setPersons(persons.map(p => 
      p.id === personId 
        ? { ...p, phoneNumbers: [...p.phoneNumbers, newPhone] }
        : p
    ));
  }

  // Adresse hinzufügen
  function addAddress() {
    const newAddress: Address = {
      id: `temp-addr-${Date.now()}`,
      street: "",
      streetNumber: "",
      postalCode: "",
      city: "",
      country: "Deutschland",
      addressType: "BUSINESS",
      isPrimary: addresses.length === 0
    };
    setAddresses([...addresses, newAddress]);
  }

  // Gruppen-E-Mail hinzufügen
  function addGroupEmail() {
    const newEmail: EmailAddress = {
      id: `temp-group-email-${Date.now()}`,
      email: "",
      emailType: "WORK",
      isPrimary: groupEmails.length === 0
    };
    setGroupEmails([...groupEmails, newEmail]);
  }

  // Gruppen-Telefon hinzufügen
  function addGroupPhone() {
    const newPhone: PhoneNumber = {
      id: `temp-group-phone-${Date.now()}`,
      number: "",
      phoneType: "WORK",
      isPrimary: groupPhones.length === 0
    };
    setGroupPhones([...groupPhones, newPhone]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = mode === 'edit' && contactGroup 
        ? `/api/contact-groups/${contactGroup.id}`
        : '/api/contact-groups';
      
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          category,
          website: website || null,
          notes: notes || null,
          persons,
          addresses,
          groupEmails,
          groupPhones
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Fehler beim ${mode === 'edit' ? 'Aktualisieren' : 'Erstellen'} des Kontakts`);
      }

      await response.json();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basis-Informationen */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Kontaktgruppe
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="z.B. Müller Architekten GmbH"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kategorie *
            </label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value)}
              required
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Kategorie wählen..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="https://www.beispiel.de"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notizen
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Zusätzliche Informationen..."
            />
          </div>
        </div>
      </div>

      {/* Adressen */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Adressen
          </h3>
          <button
            type="button"
            onClick={addAddress}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Adresse hinzufügen
          </button>
        </div>

        {addresses.map((address, index) => (
          <div key={address.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Adresse {index + 1}</h4>
              <button
                type="button"
                onClick={() => setAddresses(addresses.filter(a => a.id !== address.id))}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddresses(addresses.map(a => 
                    a.id === address.id ? { ...a, street: e.target.value } : a
                  ))}
                  placeholder="Straße"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <input
                  type="text"
                  value={address.streetNumber || ""}
                  onChange={(e) => setAddresses(addresses.map(a => 
                    a.id === address.id ? { ...a, streetNumber: e.target.value } : a
                  ))}
                  placeholder="Nr."
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => setAddresses(addresses.map(a => 
                    a.id === address.id ? { ...a, postalCode: e.target.value } : a
                  ))}
                  placeholder="PLZ"
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddresses(addresses.map(a => 
                    a.id === address.id ? { ...a, city: e.target.value } : a
                  ))}
                  placeholder="Stadt"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              
              <Select
                value={address.addressType}
                onValueChange={(value) => setAddresses(addresses.map(a => 
                  a.id === address.id ? { ...a, addressType: value } : a
                ))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUSINESS">Geschäftlich</SelectItem>
                  <SelectItem value="PRIVATE">Privat</SelectItem>
                  <SelectItem value="BILLING">Rechnung</SelectItem>
                  <SelectItem value="SHIPPING">Lieferung</SelectItem>
                </SelectContent>
              </Select>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={address.isPrimary}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setAddresses(addresses.map(a => ({
                        ...a,
                        isPrimary: a.id === address.id
                      })));
                    } else {
                      setAddresses(addresses.map(a => 
                        a.id === address.id ? { ...a, isPrimary: false } : a
                      ));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Hauptadresse</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Gruppen-Kontaktdaten */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Allgemeine Kontaktdaten
        </h3>
        
        {/* E-Mails */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              E-Mail-Adressen
            </label>
            <button
              type="button"
              onClick={addGroupEmail}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {groupEmails.map((email) => (
            <div key={email.id} className="flex gap-2 mb-2">
              <input
                type="email"
                value={email.email}
                onChange={(e) => setGroupEmails(groupEmails.map(em => 
                  em.id === email.id ? { ...em, email: e.target.value } : em
                ))}
                placeholder="E-Mail-Adresse"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <Select
                value={email.emailType}
                onValueChange={(value) => setGroupEmails(groupEmails.map(em => 
                  em.id === email.id ? { ...em, emailType: value } : em
                ))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORK">Geschäftlich</SelectItem>
                  <SelectItem value="PRIVATE">Privat</SelectItem>
                  <SelectItem value="OTHER">Sonstige</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setGroupEmails(groupEmails.filter(em => em.id !== email.id))}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Telefonnummern */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefonnummern
            </label>
            <button
              type="button"
              onClick={addGroupPhone}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {groupPhones.map((phone) => (
            <div key={phone.id} className="flex gap-2 mb-2">
              <input
                type="tel"
                value={phone.number}
                onChange={(e) => setGroupPhones(groupPhones.map(ph => 
                  ph.id === phone.id ? { ...ph, number: e.target.value } : ph
                ))}
                placeholder="Telefonnummer"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <Select
                value={phone.phoneType}
                onValueChange={(value) => setGroupPhones(groupPhones.map(ph => 
                  ph.id === phone.id ? { ...ph, phoneType: value } : ph
                ))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORK">Geschäftlich</SelectItem>
                  <SelectItem value="MOBILE">Mobil</SelectItem>
                  <SelectItem value="FAX">Fax</SelectItem>
                  <SelectItem value="PRIVATE">Privat</SelectItem>
                  <SelectItem value="OTHER">Sonstige</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setGroupPhones(groupPhones.filter(ph => ph.id !== phone.id))}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Personen */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <User className="w-5 h-5" />
            Personen
          </h3>
          <button
            type="button"
            onClick={addPerson}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Person hinzufügen
          </button>
        </div>

        {persons.map((person, index) => (
          <div key={person.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Person {index + 1}</h4>
              <button
                type="button"
                onClick={() => removePerson(person.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={person.title || ""}
                onChange={(e) => updatePerson(person.id, { title: e.target.value })}
                placeholder="Titel (optional)"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              />
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={person.firstName}
                  onChange={(e) => updatePerson(person.id, { firstName: e.target.value })}
                  placeholder="Vorname *"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <input
                  type="text"
                  value={person.lastName}
                  onChange={(e) => updatePerson(person.id, { lastName: e.target.value })}
                  placeholder="Nachname *"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              
              <input
                type="text"
                value={person.position || ""}
                onChange={(e) => updatePerson(person.id, { position: e.target.value })}
                placeholder="Position"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              />
              
              <input
                type="text"
                value={person.department || ""}
                onChange={(e) => updatePerson(person.id, { department: e.target.value })}
                placeholder="Abteilung"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Person E-Mails */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">E-Mail-Adressen</label>
                <button
                  type="button"
                  onClick={() => addEmailToPerson(person.id)}
                  className="text-sm text-indigo-600 dark:text-indigo-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {person.emails.map((email) => (
                <div key={email.id} className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={email.email}
                    onChange={(e) => updatePerson(person.id, {
                      emails: person.emails.map(em => 
                        em.id === email.id ? { ...em, email: e.target.value } : em
                      )
                    })}
                    placeholder="E-Mail-Adresse"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => updatePerson(person.id, {
                      emails: person.emails.filter(em => em.id !== email.id)
                    })}
                    className="text-red-600 dark:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Person Phone Numbers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefonnummern</label>
                <button
                  type="button"
                  onClick={() => addPhoneToPerson(person.id)}
                  className="text-sm text-indigo-600 dark:text-indigo-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {person.phoneNumbers.map((phone) => (
                <div key={phone.id} className="flex gap-2 mb-2">
                  <input
                    type="tel"
                    value={phone.number}
                    onChange={(e) => updatePerson(person.id, {
                      phoneNumbers: person.phoneNumbers.map(ph => 
                        ph.id === phone.id ? { ...ph, number: e.target.value } : ph
                      )
                    })}
                    placeholder="Telefonnummer"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => updatePerson(person.id, {
                      phoneNumbers: person.phoneNumbers.filter(ph => ph.id !== phone.id)
                    })}
                    className="text-red-600 dark:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !category}
          className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (mode === 'edit' ? 'Wird aktualisiert...' : 'Wird erstellt...') : (mode === 'edit' ? 'Kontaktgruppe aktualisieren' : 'Kontaktgruppe erstellen')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}