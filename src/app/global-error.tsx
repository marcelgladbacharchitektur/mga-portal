'use client'

import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Ein unerwarteter Fehler ist aufgetreten
            </h2>
            <p className="text-gray-600 mb-4">
              Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => reset()}
                className="flex-1"
              >
                Erneut versuchen
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="secondary"
                className="flex-1"
              >
                Zur Startseite
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-4 bg-gray-100 rounded">
                <summary className="cursor-pointer text-sm text-gray-600">
                  Fehlerdetails (nur in Entwicklung)
                </summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}