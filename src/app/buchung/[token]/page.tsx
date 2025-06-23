'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DayPicker } from 'react-day-picker'
import { format, isBefore, startOfToday, addMonths } from 'date-fns'
import { de } from 'date-fns/locale'
import { Calendar, Clock, User, Mail, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import 'react-day-picker/dist/style.css'
import './calendar-styles.css'

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

export default function CalendlyBookingPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [bookingToken, setBookingToken] = useState<BookingToken | null>(null)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(true)

  useEffect(() => {
    validateToken()
  }, [token])

  useEffect(() => {
    if (bookingToken) {
      loadMonthAvailability(new Date())
    }
  }, [bookingToken])

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
    } catch (error) {
      setError('Verbindungsfehler. Bitte versuchen Sie es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  const loadMonthAvailability = async (month: Date) => {
    setLoadingAvailability(true)
    try {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)
      
      const response = await fetch(
        `/api/availability?start=${startOfMonth.toISOString().split('T')[0]}&end=${endOfMonth.toISOString().split('T')[0]}&duration=${bookingToken?.appointmentType.durationMinutes || 90}`
      )
      
      if (response.ok) {
        const data = await response.json()
        // Extract unique dates that have available slots
        const datesWithSlots = data.slots
          .filter((slot: TimeSlot) => slot.available)
          .map((slot: TimeSlot) => {
            // Parse the date in local timezone
            const date = new Date(slot.start)
            // Create a date at midnight in local timezone
            return new Date(date.getFullYear(), date.getMonth(), date.getDate())
          })
        
        // Remove duplicates by comparing timestamps
        const uniqueDatesMap = new Map<number, Date>()
        datesWithSlots.forEach(date => {
          uniqueDatesMap.set(date.getTime(), date)
        })
        
        const uniqueDates = Array.from(uniqueDatesMap.values())
        console.log('Available dates:', uniqueDates.map(d => d.toLocaleDateString()))
        setAvailableDates(uniqueDates)
      }
    } catch (error) {
      console.error('Error loading month availability:', error)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !bookingToken) return
    
    setLoadingSlots(true)
    setTimeSlots([])
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const response = await fetch(
        `/api/availability?start=${dateStr}&end=${dateStr}&duration=${bookingToken.appointmentType.durationMinutes}`
      )
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Termine')
      }
      
      const data = await response.json()
      const availableSlots = data.slots.filter((slot: TimeSlot) => slot.available)
      setTimeSlots(availableSlots)
    } catch (error) {
      toast.error('Fehler beim Laden der verfügbaren Zeiten')
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedSlot || !bookingToken) return
    
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          notes: notes
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Buchung fehlgeschlagen')
      }
      
      setSuccess(true)
      toast.success('Termin erfolgreich gebucht!')
    } catch (error: any) {
      toast.error(error.message || 'Fehler bei der Buchung')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => router.push('/')}
            variant="link"
          >
            Zur Startseite
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Termin erfolgreich gebucht!</h2>
            <p className="text-gray-600 mb-6">
              Sie erhalten in Kürze eine Bestätigungsmail an {bookingToken?.contactEmail}
            </p>
            <Button
              onClick={() => router.push('/')}
            >
              Zur Startseite
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const dayPickerStyles = {
    caption: { color: '#1f2937' },
    caption_label: { fontSize: '1.125rem', fontWeight: '600' },
    nav_button: {
      color: '#6b7280',
      width: '2rem',
      height: '2rem'
    },
    head_cell: {
      color: '#6b7280',
      fontWeight: '500',
      fontSize: '0.875rem'
    },
    cell: {
      padding: '0.25rem'
    },
    button: {
      width: '2.5rem',
      height: '2.5rem',
      fontSize: '0.875rem',
      borderRadius: '0.375rem'
    },
    day_selected: {
      backgroundColor: '#2563eb',
      color: 'white',
      fontWeight: '600'
    },
    day_today: {
      fontWeight: '600',
      color: '#2563eb'
    },
    day_disabled: {
      color: '#d1d5db',
      cursor: 'not-allowed'
    }
  }

  const modifiers = {
    available: availableDates,
    selected: selectedDate
  }

  const modifiersStyles = {
    available: {
      fontWeight: '600',
      color: '#2563eb',
      position: 'relative' as const
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold">{bookingToken?.appointmentType.name}</h1>
            {bookingToken?.appointmentType.description && (
              <p className="mt-2 opacity-90">{bookingToken.appointmentType.description}</p>
            )}
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{bookingToken?.appointmentType.durationMinutes} Minuten</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>{bookingToken?.contactName}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
            {/* Calendar Section */}
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Datum wählen
              </h2>
              
              <div className="flex justify-center">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    // Only allow selection of available dates
                    if (date && availableDates.some(d => d.toDateString() === date.toDateString())) {
                      setSelectedDate(date)
                    }
                  }}
                  locale={de}
                  disabled={[
                    { before: startOfToday() }
                  ]}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  styles={dayPickerStyles}
                  showOutsideDays={true}
                  fixedWeeks={true}
                  onMonthChange={loadMonthAvailability}
                  numberOfMonths={1}
                />
              </div>
              
              {loadingAvailability && (
                <div className="text-center mt-2">
                  <span className="text-sm text-gray-500">Verfügbarkeit wird geladen...</span>
                </div>
              )}
            </div>

            {/* Time Slots Section */}
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Uhrzeit wählen
              </h2>
              
              {!selectedDate ? (
                <p className="text-gray-500 text-center py-8">
                  Bitte wählen Sie zuerst ein Datum aus
                </p>
              ) : loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : timeSlots.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Keine verfügbaren Termine für dieses Datum
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot)}
                      variant={selectedSlot?.start === slot.start ? 'default' : 'outline'}
                      className="w-full justify-center"
                    >
                      {format(new Date(slot.start), 'HH:mm')} - {format(new Date(slot.end), 'HH:mm')}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes and Submit Section */}
          {selectedSlot && (
            <div className="border-t p-6">
              <div className="mb-4 space-y-2">
                <Label htmlFor="notes">Zusätzliche Informationen (optional)</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gibt es etwas, das wir vor dem Termin wissen sollten?"
                />
              </div>
              
              <div className="bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {selectedDate && format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}
                    </p>
                    <p className="text-gray-600">
                      {format(new Date(selectedSlot.start), 'HH:mm')} - {format(new Date(selectedSlot.end), 'HH:mm')}
                    </p>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Wird gebucht...
                      </>
                    ) : (
                      'Termin buchen'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}