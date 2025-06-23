'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, User, Mail, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface BookingToken {
  token: string
  appointmentTypeId: string
  contactEmail: string
  contactName: string
  appointmentType: {
    id: string
    name: string
    durationMinutes: number
    description?: string
  }
}

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [bookingToken, setBookingToken] = useState<BookingToken | null>(null)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    validateToken()
  }, [token])

  useEffect(() => {
    if (selectedDate && bookingToken) {
      fetchAvailableSlots()
    }
  }, [selectedDate, bookingToken])

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/booking-tokens/${token}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Dieser Buchungslink ist ungültig.')
        } else {
          const data = await response.json()
          setError(data.error || 'Ein Fehler ist aufgetreten.')
        }
        setLoading(false)
        return
      }
      
      const data = await response.json()
      setBookingToken(data)
      
      // Set default date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setSelectedDate(tomorrow.toISOString().split('T')[0])
    } catch (error) {
      setError('Verbindungsfehler. Bitte versuchen Sie es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!bookingToken) return
    
    setLoadingSlots(true)
    try {
      const startDate = new Date(selectedDate)
      const endDate = new Date(selectedDate)
      endDate.setDate(endDate.getDate() + 1)
      
      const response = await fetch(
        `/api/availability?start=${startDate.toISOString()}&end=${endDate.toISOString()}&appointmentTypeId=${bookingToken.appointmentTypeId}`
      )
      
      if (!response.ok) throw new Error()
      
      const data = await response.json()
      setSimeSlots(data.slots || [])
    } catch (error) {
      toast.error('Fehler beim Laden der verfügbaren Termine')
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleBooking = async () => {
    if (!selectedSlot || !bookingToken) return
    
    setSubmitting(true)
    try {
      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          slotStart: selectedSlot.start,
          slotEnd: selectedSlot.end,
          notes: notes
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Buchung fehlgeschlagen')
      }
      
      setSuccess(true)
      toast.success('Ihr Termin wurde erfolgreich gebucht!')
    } catch (error: any) {
      toast.error(error.message || 'Fehler bei der Buchung')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ungültiger Buchungslink</h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Termin erfolgreich gebucht!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sie erhalten in Kürze eine Bestätigung per E-Mail an {bookingToken?.contactEmail}.
          </p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Termin buchen</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Wählen Sie einen passenden Termin für Ihr Gespräch
          </p>
        </div>

        {bookingToken && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Booking info */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Termindetails</h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">{bookingToken.appointmentType.name}</p>
                        {bookingToken.appointmentType.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {bookingToken.appointmentType.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span>{bookingToken.appointmentType.durationMinutes} Minuten</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <span>{bookingToken.contactName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span>{bookingToken.contactEmail}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Datum auswählen</h3>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium mb-4">Verfügbare Zeiten</h3>
                {loadingSlots ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : timeSlots.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    Keine verfügbaren Termine an diesem Tag
                  </p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {timeSlots.filter(slot => slot.available).map((slot) => {
                      const time = new Date(slot.start).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      const isSelected = selectedSlot?.start === slot.start
                      
                      return (
                        <button
                          key={slot.start}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                          }`}
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Notes and submit */}
            {selectedSlot && (
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Notizen (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Gibt es etwas, das wir vor dem Termin wissen sollten?"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium mb-1">Gewählter Termin:</p>
                  <p className="text-lg">
                    {new Date(selectedSlot.start).toLocaleDateString('de-DE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {' um '}
                    {new Date(selectedSlot.start).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {submitting ? 'Wird gebucht...' : 'Termin verbindlich buchen'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}