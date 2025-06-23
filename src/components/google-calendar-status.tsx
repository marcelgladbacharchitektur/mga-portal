'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface CalendarStatus {
  connected: boolean
  service: string
  calendarEmail?: string
  error?: string
}

export function GoogleCalendarStatus() {
  const [status, setStatus] = useState<CalendarStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      checkCalendarStatus()
    }
  }, [mounted])

  const checkCalendarStatus = async () => {
    try {
      const response = await fetch('/api/calendar/status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        connected: false,
        service: 'Google Calendar',
        error: 'Failed to check status'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-gray-400 animate-pulse" />
          <span className="text-gray-500 dark:text-gray-400">
            Überprüfe Google Calendar Status...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Google Calendar Status
      </h3>

      {status?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 dark:text-green-400 font-medium">
              Verbunden
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Service: {status.service}</p>
            {status.calendarEmail && (
              <p>Kalender: {status.calendarEmail}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-400 font-medium">
              Nicht konfiguriert
            </span>
          </div>
          {status?.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="text-sm text-red-700 dark:text-red-300">
                  <p className="font-medium">Konfiguration erforderlich</p>
                  <p className="mt-1">
                    Bitte konfigurieren Sie die Google Service Account Credentials
                    in den Umgebungsvariablen.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}