"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FixAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  async function handleFix() {
    setLoading(true);
    try {
      const response = await fetch('/api/fix-admin');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Fehler beim API-Aufruf' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Admin Account Fix
        </h1>

        {!result ? (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              Klicken Sie auf den Button, um den Admin-Account neu zu erstellen.
            </p>
            <button
              onClick={handleFix}
              disabled={loading}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Wird erstellt...' : 'Admin-Account neu erstellen'}
            </button>
          </>
        ) : result.success ? (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
                ✅ Erfolgreich erstellt!
              </h2>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">E-Mail:</span>
                  <span className="font-mono font-bold ml-2">{result.credentials.email}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Passwort:</span>
                  <span className="font-mono font-bold ml-2">{result.credentials.password}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Rolle:</span>
                  <span className="font-mono font-bold ml-2">{result.credentials.role}</span>
                </p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/login')}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Zum Login
            </button>
          </div>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              ❌ Fehler
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300">{result.error}</p>
            {result.details && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">{result.details}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}