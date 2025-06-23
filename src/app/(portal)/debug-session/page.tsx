"use client";

import { useSession } from "next-auth/react";

export default function DebugSessionPage() {
  const { data: session, status } = useSession();

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Session Debug Information</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="font-semibold mb-2">Session Status:</h2>
            <p className={`text-lg ${status === 'authenticated' ? 'text-green-600' : status === 'loading' ? 'text-yellow-600' : 'text-red-600'}`}>
              {status}
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Session Data:</h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="font-semibold mb-2">User Role:</h2>
            <p className="text-lg">
              {session?.user?.role || 'NO ROLE DEFINED'}
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">User Email:</h2>
            <p className="text-lg">
              {session?.user?.email || 'NO EMAIL'}
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-2">ContactGroup ID:</h2>
            <p className="text-lg">
              {session?.user?.contactGroupId || 'NO CONTACT GROUP'}
            </p>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Wenn die Rolle fehlt:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Prüfen Sie die Datenbank: SELECT id, email, role FROM User;</li>
            <li>Update für fehlende Rollen: UPDATE User SET role = 'ADMIN' WHERE email = 'admin@mga-portal.com';</li>
            <li>Logout und erneut einloggen nach Datenbankänderung</li>
          </ol>
        </div>
      </div>
    </div>
  );
}