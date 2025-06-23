'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Save } from 'lucide-react'
import { Modal } from '@/components/modal'
import { TimeEntryForm } from '@/components/time-tracking/time-entry-form'
import { toast } from 'sonner'

export function GlobalTimer() {
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Lade gespeicherten Timer-Status aus localStorage
    const savedTimer = localStorage.getItem('globalTimer')
    if (savedTimer) {
      const { isRunning: wasRunning, startTime: savedStart, seconds: savedSeconds } = JSON.parse(savedTimer)
      if (wasRunning && savedStart) {
        const start = new Date(savedStart)
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000)
        setSeconds(elapsed)
        setStartTime(start)
        setIsRunning(true)
      } else {
        setSeconds(savedSeconds || 0)
      }
    }
  }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    // Speichere Timer-Status
    localStorage.setItem('globalTimer', JSON.stringify({
      isRunning,
      startTime,
      seconds
    }))

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, startTime, seconds])

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
    setStartTime(new Date())
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleStop = () => {
    setIsRunning(false)
    if (seconds > 0) {
      setShowSaveModal(true)
    }
  }

  const handleSaveSuccess = () => {
    setShowSaveModal(false)
    setSeconds(0)
    setStartTime(null)
    localStorage.removeItem('globalTimer')
    toast.success('Zeiteintrag gespeichert')
  }

  const handleDiscard = () => {
    setShowSaveModal(false)
    setSeconds(0)
    setStartTime(null)
    localStorage.removeItem('globalTimer')
  }

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[80px] text-center">
          {formatTime(seconds)}
        </span>
        
        <div className="flex items-center gap-1">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
              title="Timer starten"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="p-1.5 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded transition-colors"
              title="Timer pausieren"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          
          {seconds > 0 && (
            <button
              onClick={handleStop}
              className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Timer stoppen und speichern"
            >
              <Square className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && startTime && (
        <Modal
          isOpen={true}
          onClose={handleDiscard}
          title="Zeiteintrag speichern"
          size="xl"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Aufgezeichnete Zeit: <strong>{formatTime(seconds)}</strong>
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                Von {startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} bis {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <TimeEntryForm
              onSuccess={handleSaveSuccess}
              onCancel={handleDiscard}
              defaultStartTime={startTime}
              defaultEndTime={new Date()}
              defaultDuration={Math.floor(seconds / 60)}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Zeit verwerfen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}