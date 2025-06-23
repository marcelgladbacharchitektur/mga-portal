"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, Lock, LogOut, Check, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  // Name ändern
  const [name, setName] = useState(session?.user?.name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState("");
  
  // Passwort ändern
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  async function handleNameUpdate(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameSuccess(false);
    setNameLoading(true);

    try {
      const response = await fetch('/api/profile/name', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Aktualisieren des Namens');
      }

      setNameSuccess(true);
      await update(); // Session aktualisieren
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (error) {
      setNameError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setNameLoading(false);
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    // Validierung
    if (newPassword !== confirmPassword) {
      setPasswordError("Die Passwörter stimmen nicht überein");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Das Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          currentPassword,
          newPassword 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Ändern des Passworts');
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push('/login');
  }

  if (!session) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <User className="w-8 h-8" />
            Benutzerprofil
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verwalten Sie Ihre persönlichen Einstellungen
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Account-Informationen
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">E-Mail-Adresse</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{session.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Registriert seit</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date().toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Name ändern */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Name ändern
            </h2>
            <form onSubmit={handleNameUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Anzeigename</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ihr Name"
                />
              </div>

              {nameError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {nameError}
                </div>
              )}

              {nameSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  Name erfolgreich aktualisiert
                </div>
              )}

              <button
                type="submit"
                disabled={nameLoading || !name.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {nameLoading ? 'Wird gespeichert...' : 'Name speichern'}
              </button>
            </form>
          </div>

          {/* Passwort ändern */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Passwort ändern
            </h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  Passwort erfolgreich geändert
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {passwordLoading ? 'Wird geändert...' : 'Passwort ändern'}
              </button>
            </form>
          </div>

          {/* Abmelden */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Sitzung
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Melden Sie sich von Ihrem Account ab.
            </p>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}