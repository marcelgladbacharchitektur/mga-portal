'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Video, Check } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns'
import { de } from 'date-fns/locale'

interface TimeSlot {
  start: string
  end: string
  time: string
  available: boolean
}

interface BookingData {
  date: string
  time: string
  name: string
  email: string
  phone: string
  company: string
  projectDescription: string
  location: 'office' | 'site' | 'video'
  customLocation?: string
}

export default function BookingPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'date' | 'form' | 'success'>('date')
  const [formData, setFormData] = useState<BookingData>({
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    projectDescription: '',
    location: 'office',
    customLocation: ''
  })

  // Lade verfügbare Termine für ausgewähltes Datum
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  const loadAvailableSlots = async (date: Date) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/availability?date=${date.toISOString()}&duration=90`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Termine:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setFormData({ ...formData, date: selectedDate!.toISOString(), time })
    setStep('form')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const locationMap = {
        office: 'Schloßhofer Straße 6/1/9, 1210 Wien',
        site: formData.customLocation || 'Vor Ort (Details werden besprochen)',
        video: 'Videogespräch'
      }

      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          location: locationMap[formData.location],
          isVideo: formData.location === 'video'
        })
      })

      if (response.ok) {
        setStep('success')
      } else {
        throw new Error('Buchung fehlgeschlagen')
      }
    } catch (error) {
      console.error('Fehler bei der Buchung:', error)
      alert('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  // Kalender-Wochen generieren
  const weeks = []
  const start = startOfWeek(currentDate, { weekStartsOn: 1 })
  const end = endOfWeek(currentDate, { weekStartsOn: 1 })
  let day = start
  
  while (day <= end) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(day))
      day = addDays(day, 1)
    }
    weeks.push(week)
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-mga-cream flex items-center justify-center px-mga-3">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-mga-sage rounded-full flex items-center justify-center mx-auto mb-mga-4">
            <Check className="w-8 h-8 text-mga-cream" />
          </div>
          <h1 className="mga-heading-1 mb-mga-3">Termin erfolgreich gebucht</h1>
          <p className="mga-text text-mga-gray-dark mb-mga-2">
            Vielen Dank für Ihre Buchung. Sie erhalten in Kürze eine Bestätigung per E-Mail.
          </p>
          <p className="mga-text">
            <strong>Datum:</strong> {selectedDate && format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}<br />
            <strong>Uhrzeit:</strong> {selectedTime}
          </p>
          <a href="https://mga-portal.com" className="mga-button inline-block mt-mga-5">
            Zurück zur Webseite
          </a>
        </div>
      </div>
    )
  }

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-mga-cream py-mga-6">
        <div className="mga-container max-w-3xl">
          <button
            onClick={() => setStep('date')}
            className="mga-button-ghost mb-mga-4 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück zur Terminauswahl
          </button>

          <h1 className="mga-heading-1 mb-mga-2">Ihre Kontaktdaten</h1>
          <p className="mga-text text-mga-gray-dark mb-mga-6">
            Termin am {selectedDate && format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })} um {selectedTime}
          </p>

          <form onSubmit={handleSubmit} className="space-y-mga-5">
            <div className="grid md:grid-cols-2 gap-mga-5">
              <div>
                <label className="block text-mga-sm font-medium mb-mga-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mga-input"
                />
              </div>

              <div>
                <label className="block text-mga-sm font-medium mb-mga-1">
                  E-Mail *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mga-input"
                />
              </div>

              <div>
                <label className="block text-mga-sm font-medium mb-mga-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mga-input"
                />
              </div>

              <div>
                <label className="block text-mga-sm font-medium mb-mga-1">
                  Firma
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="mga-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-mga-sm font-medium mb-mga-1">
                Projektbeschreibung *
              </label>
              <textarea
                required
                rows={4}
                value={formData.projectDescription}
                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                className="mga-input resize-none"
                placeholder="Bitte beschreiben Sie kurz Ihr Bauvorhaben..."
              />
            </div>

            <div>
              <label className="block text-mga-sm font-medium mb-mga-3">
                Wo soll das Gespräch stattfinden?
              </label>
              <div className="space-y-mga-2">
                <label className="flex items-center gap-mga-2 cursor-pointer">
                  <input
                    type="radio"
                    name="location"
                    value="office"
                    checked={formData.location === 'office'}
                    onChange={(e) => setFormData({ ...formData, location: 'office' })}
                    className="w-4 h-4 text-mga-black focus:ring-mga-sage"
                  />
                  <MapPin className="w-4 h-4 text-mga-gray-dark" />
                  <span className="mga-text">In meinem Büro (Schloßhofer Straße 6/1/9, 1210 Wien)</span>
                </label>

                <label className="flex items-center gap-mga-2 cursor-pointer">
                  <input
                    type="radio"
                    name="location"
                    value="site"
                    checked={formData.location === 'site'}
                    onChange={(e) => setFormData({ ...formData, location: 'site' })}
                    className="w-4 h-4 text-mga-black focus:ring-mga-sage"
                  />
                  <MapPin className="w-4 h-4 text-mga-gray-dark" />
                  <span className="mga-text">Vor Ort beim Projekt</span>
                </label>

                <label className="flex items-center gap-mga-2 cursor-pointer">
                  <input
                    type="radio"
                    name="location"
                    value="video"
                    checked={formData.location === 'video'}
                    onChange={(e) => setFormData({ ...formData, location: 'video' })}
                    className="w-4 h-4 text-mga-black focus:ring-mga-sage"
                  />
                  <Video className="w-4 h-4 text-mga-gray-dark" />
                  <span className="mga-text">Videogespräch</span>
                </label>
              </div>

              {formData.location === 'site' && (
                <div className="mt-mga-3">
                  <label className="block text-mga-sm font-medium mb-mga-1">
                    Projektadresse
                  </label>
                  <input
                    type="text"
                    value={formData.customLocation}
                    onChange={(e) => setFormData({ ...formData, customLocation: e.target.value })}
                    className="mga-input"
                    placeholder="Adresse des Projekts"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-mga-3 pt-mga-3">
              <button
                type="button"
                onClick={() => setStep('date')}
                className="mga-button-ghost"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="mga-button flex-1"
              >
                {loading ? 'Wird gebucht...' : 'Termin verbindlich buchen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mga-cream">
      {/* Hero Section */}
      <section className="mga-section border-b border-mga-gray">
        <div className="mga-container max-w-4xl text-center">
          <h1 className="mga-heading-1 mb-mga-4">
            Lassen Sie uns über Ihr Projekt sprechen
          </h1>
          <p className="mga-text text-mga-gray-dark max-w-2xl mx-auto">
            Buchen Sie ein unverbindliches Erstgespräch. In 90 Minuten besprechen wir Ihre Ideen, 
            Wünsche und die nächsten Schritte für Ihr Bauvorhaben.
          </p>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="mga-section">
        <div className="mga-container max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-mga-6">
            {/* Kalender */}
            <div>
              <div className="flex items-center justify-between mb-mga-4">
                <h2 className="mga-heading-3">Wählen Sie ein Datum</h2>
                <div className="flex gap-mga-2">
                  <button
                    onClick={() => setCurrentDate(addDays(currentDate, -7))}
                    className="p-2 hover:bg-mga-gray-light rounded transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(addDays(currentDate, 7))}
                    className="p-2 hover:bg-mga-gray-light rounded transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-white border border-mga-gray">
                <div className="grid grid-cols-7 border-b border-mga-gray">
                  {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                    <div key={day} className="p-mga-2 text-center text-mga-xs font-medium text-mga-gray-dark">
                      {day}
                    </div>
                  ))}
                </div>

                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7">
                    {week.map((day, dayIndex) => {
                      const isToday = isSameDay(day, new Date())
                      const isPast = day < new Date()
                      const isSelected = selectedDate && isSameDay(day, selectedDate)
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6

                      return (
                        <button
                          key={dayIndex}
                          onClick={() => !isPast && !isWeekend && handleDateSelect(day)}
                          disabled={isPast || isWeekend}
                          className={`
                            p-mga-3 border-r border-b border-mga-gray-light transition-colors
                            ${isSelected ? 'bg-mga-black text-mga-cream' : ''}
                            ${isToday && !isSelected ? 'bg-mga-sage/10' : ''}
                            ${isPast || isWeekend ? 'text-mga-gray-light cursor-not-allowed' : 'hover:bg-mga-gray-light cursor-pointer'}
                          `}
                        >
                          <div className="text-mga-sm">{format(day, 'd')}</div>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Zeitslots */}
            <div>
              {selectedDate ? (
                <>
                  <h3 className="mga-heading-3 mb-mga-4">
                    Verfügbare Zeiten am {format(selectedDate, 'EEEE, d. MMMM', { locale: de })}
                  </h3>
                  {loading ? (
                    <div className="text-center py-mga-6 text-mga-gray-dark">
                      Lade verfügbare Termine...
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-mga-2">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => handleTimeSelect(slot.time)}
                          className={`
                            p-mga-3 border border-mga-gray text-center transition-all
                            ${selectedTime === slot.time 
                              ? 'bg-mga-black text-mga-cream border-mga-black' 
                              : 'hover:border-mga-black'
                            }
                          `}
                        >
                          <div className="flex items-center justify-center gap-mga-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-mga-sm font-medium">{slot.time}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-mga-6 text-mga-gray-dark">
                      Keine verfügbaren Termine an diesem Tag
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-mga-6 text-mga-gray-dark">
                  <Calendar className="w-12 h-12 mx-auto mb-mga-3 text-mga-gray" />
                  <p className="mga-text">Wählen Sie ein Datum aus dem Kalender</p>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-mga-6 p-mga-4 bg-white border border-mga-gray">
            <h3 className="font-medium mb-mga-2">Was Sie erwartet:</h3>
            <ul className="space-y-mga-1 text-mga-sm text-mga-gray-dark">
              <li>• 90-minütiges unverbindliches Erstgespräch</li>
              <li>• Besichtigung und Analyse Ihrer Bauaufgabe</li>
              <li>• Erste Einschätzung zu Machbarkeit und Kosten</li>
              <li>• Klärung der weiteren Zusammenarbeit</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}