'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface TimeSlot {
  start: string
  end: string
}

interface TimeSlotPickerProps {
  day: string
  slots: TimeSlot[]
  onChange: (slots: TimeSlot[]) => void
}

export function TimeSlotPicker({ day, slots, onChange }: TimeSlotPickerProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<number | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate time labels from 6:00 to 22:00
  const hours = Array.from({ length: 17 }, (_, i) => i + 6)
  const timeSlots = hours.flatMap(hour => 
    [0, 15, 30, 45].map(minute => ({
      hour,
      minute,
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      index: (hour - 6) * 4 + minute / 15
    }))
  )

  const isSlotActive = (index: number) => {
    const time = timeSlots[index].time
    return slots.some(slot => {
      const startIndex = timeSlots.findIndex(t => t.time === slot.start)
      const endIndex = timeSlots.findIndex(t => t.time === slot.end)
      return index >= startIndex && index < endIndex
    })
  }

  const isInSelection = (index: number) => {
    if (selectionStart === null || selectionEnd === null) return false
    const start = Math.min(selectionStart, selectionEnd)
    const end = Math.max(selectionStart, selectionEnd)
    return index >= start && index <= end
  }

  const handleMouseDown = (index: number) => {
    setIsSelecting(true)
    setSelectionStart(index)
    setSelectionEnd(index)
  }

  const handleMouseEnter = (index: number) => {
    if (isSelecting) {
      setSelectionEnd(index)
    }
  }

  const handleMouseUp = () => {
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      const start = Math.min(selectionStart, selectionEnd)
      const end = Math.max(selectionStart, selectionEnd)
      
      const startTime = timeSlots[start].time
      const endTime = timeSlots[Math.min(end + 1, timeSlots.length - 1)].time
      
      // Check if we're removing or adding a slot
      const isRemoving = isSlotActive(start)
      
      if (isRemoving) {
        // Remove slots that overlap with selection
        const newSlots = slots.filter(slot => {
          const slotStartIndex = timeSlots.findIndex(t => t.time === slot.start)
          const slotEndIndex = timeSlots.findIndex(t => t.time === slot.end)
          return slotEndIndex <= start || slotStartIndex > end
        })
        onChange(newSlots)
      } else {
        // Add new slot, merging with adjacent ones if needed
        const newSlot: TimeSlot = { start: startTime, end: endTime }
        const mergedSlots = mergeOverlappingSlots([...slots, newSlot])
        onChange(mergedSlots)
      }
    }
    
    setIsSelecting(false)
    setSelectionStart(null)
    setSelectionEnd(null)
  }

  const mergeOverlappingSlots = (slots: TimeSlot[]): TimeSlot[] => {
    if (slots.length === 0) return []
    
    // Sort slots by start time
    const sorted = [...slots].sort((a, b) => {
      const aIndex = timeSlots.findIndex(t => t.time === a.start)
      const bIndex = timeSlots.findIndex(t => t.time === b.start)
      return aIndex - bIndex
    })
    
    const merged: TimeSlot[] = []
    let current = sorted[0]
    
    for (let i = 1; i < sorted.length; i++) {
      const currentEndIndex = timeSlots.findIndex(t => t.time === current.end)
      const nextStartIndex = timeSlots.findIndex(t => t.time === sorted[i].start)
      
      if (currentEndIndex >= nextStartIndex) {
        // Merge overlapping slots
        const currentEndIdx = timeSlots.findIndex(t => t.time === current.end)
        const nextEndIdx = timeSlots.findIndex(t => t.time === sorted[i].end)
        if (nextEndIdx > currentEndIdx) {
          current = { ...current, end: sorted[i].end }
        }
      } else {
        merged.push(current)
        current = sorted[i]
      }
    }
    merged.push(current)
    
    return merged
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        handleMouseUp()
      }
    }
    
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isSelecting, selectionStart, selectionEnd, slots])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium capitalize">{day}</h4>
        {slots.length > 0 && (
          <Button
            onClick={() => onChange([])}
            variant="ghost"
            size="sm"
            className="h-auto py-0 px-2 text-xs"
          >
            Alle löschen
          </Button>
        )}
      </div>
      
      <div className="relative" ref={containerRef}>
        {/* Time labels */}
        <div className="flex mb-1">
          {hours.map((hour, i) => (
            <div key={hour} className="flex-1 text-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {i % 2 === 0 ? `${hour}:00` : ''}
              </span>
            </div>
          ))}
        </div>
        
        {/* Time slots grid */}
        <div 
          className="flex select-none"
          onMouseLeave={() => {
            if (isSelecting) {
              setSelectionEnd(null)
            }
          }}
        >
          {timeSlots.map((slot, index) => {
            const isActive = isSlotActive(index)
            const isHovering = isInSelection(index)
            const isQuarterHour = slot.minute === 0
            
            return (
              <div
                key={`${slot.hour}-${slot.minute}`}
                className={cn(
                  "flex-1 h-10 border-l cursor-pointer transition-all",
                  isQuarterHour ? "border-gray-300 dark:border-gray-600" : "border-gray-200 dark:border-gray-700",
                  isActive && !isHovering && "bg-blue-500 hover:bg-blue-600",
                  !isActive && !isHovering && "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
                  isHovering && (isActive ? "bg-red-400" : "bg-blue-400"),
                  index === 0 && "rounded-l-md",
                  index === timeSlots.length - 1 && "rounded-r-md border-r"
                )}
                onMouseDown={() => handleMouseDown(index)}
                onMouseEnter={() => handleMouseEnter(index)}
                title={`${slot.time}`}
              />
            )
          })}
        </div>
        
        {/* Display current slots */}
        {slots.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {slots.map((slot, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {slot.start} - {slot.end}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Klicken und ziehen Sie, um Zeitblöcke zu markieren. Klicken Sie auf aktive Blöcke, um sie zu entfernen.
      </p>
    </div>
  )
}