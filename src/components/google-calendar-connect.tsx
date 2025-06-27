'use client'

import { signIn, useSession } from 'next-auth/react'
import { Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function GoogleCalendarConnect() {
  const { data: session, status } = useSession()
  const [isConnecting, setIsConnecting] = useState(false)
  
  const isConnected = session?.user?.hasGoogleCalendar
  const isAdmin = session?.user?.role === 'ADMIN'
  
  if (status === 'loading') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }
  
  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Nur Administratoren können Google Calendar verbinden.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-medium">Google Calendar Verbindung</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isConnected 
                ? 'Ihr Google Calendar ist verbunden' 
                : 'Verbinden Sie Ihren Google Calendar für die Terminbuchung'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Verbunden</span>
            </div>
          ) : (
            <Button
              onClick={() => {
                setIsConnecting(true)
                signIn('google', { callbackUrl: '/settings' })
              }}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verbinde...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Mit Google verbinden
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {isConnected && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sie können nun Kalender in der dynamischen Kalender-Verwaltung unten hinzufügen und verwalten.
          </p>
        </div>
      )}
    </div>
  )
}