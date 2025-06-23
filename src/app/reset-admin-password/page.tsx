import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export default async function ResetAdminPasswordPage() {
  // Neues Passwort
  const newPassword = 'Admin123!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update Admin-Passwort
  await prisma.user.update({
    where: { email: 'admin@mga-portal.com' },
    data: { 
      password: hashedPassword,
      role: 'ADMIN'
    }
  });
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Passwort zurückgesetzt!
        </h1>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-6">
          <p className="text-lg mb-2">Neue Anmeldedaten:</p>
          <p className="font-mono text-sm mb-1">E-Mail: admin@mga-portal.com</p>
          <p className="font-mono text-sm font-bold">Passwort: Admin123!</p>
        </div>
        <a 
          href="/login" 
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Zum Login
        </a>
      </div>
    </div>
  );
}