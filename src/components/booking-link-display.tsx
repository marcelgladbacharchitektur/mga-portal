'use client'

import { useState, useEffect } from 'react'

export function BookingLinkDisplay() {
  const [url, setUrl] = useState('')
  
  useEffect(() => {
    setUrl(`${window.location.origin}/termin-buchen`)
  }, [])
  
  if (!url) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <code className="text-sm break-all">
          https://portal.marcelgladbach.com/termin-buchen
        </code>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <code className="text-sm break-all">
        {url}
      </code>
    </div>
  )
}