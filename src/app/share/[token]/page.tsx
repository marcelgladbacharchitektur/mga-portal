"use client";

import { useState, useEffect, use } from "react";
import { FileText, Download, Calendar, RefreshCw, Lock, AlertCircle, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

interface SharedPlan {
  id: string;
  title: string;
  description: string | null;
  project: {
    name: string;
    projectNumber: string;
  };
  latestVersion: {
    id: string;
    versionNumber: number;
    filePath: string;
    description: string | null;
    fileSize: number | null;
    uploadedAt: string;
  } | null;
}

export default function SharePage({ params }: SharePageProps) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [sharedPlan, setSharedPlan] = useState<SharedPlan | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    checkShareLink();
  }, [token]);

  async function checkShareLink(providedPassword?: string) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (providedPassword) {
        headers['X-Share-Password'] = providedPassword;
      }

      const response = await fetch(`/api/share/${token}`, { headers });
      
      if (response.status === 401) {
        const data = await response.json();
        if (data.needsPassword) {
          setNeedsPassword(true);
          setLoading(false);
          return;
        }
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Abrufen des geteilten Plans');
      }

      const data = await response.json();
      setSharedPlan(data);
      setNeedsPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    
    setLoading(true);
    await checkShareLink(password);
  }

  async function handleDownload() {
    if (!sharedPlan?.latestVersion) return;

    setDownloading(true);
    try {
      const response = await fetch(`/api/share/${token}/download`, {
        headers: password ? { 'X-Share-Password': password } : {},
      });

      if (!response.ok) throw new Error('Download fehlgeschlagen');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sharedPlan.title}_v${sharedPlan.latestVersion.versionNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download-Fehler:', err);
      alert('Der Download ist fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setDownloading(false);
    }
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Lade geteilten Plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Fehler beim Zugriff
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
            <Lock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
            Passwort erforderlich
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
            Dieser Plan ist passwortgeschützt. Bitte geben Sie das Passwort ein, um fortzufahren.
          </p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              autoFocus
            />
            <button
              type="submit"
              disabled={!password.trim()}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Zugriff anfordern
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!sharedPlan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  MGA Portal
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Geteilter Plan
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600 dark:text-gray-400">
              <p>Projekt: {sharedPlan.project.name}</p>
              <p>Nr: {sharedPlan.project.projectNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Plan Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {sharedPlan.title}
            </h2>
            {sharedPlan.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {sharedPlan.description}
              </p>
            )}
          </div>

          {sharedPlan.latestVersion ? (
            <>
              {/* Version Info */}
              <div className="p-6 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Aktuelle Version
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Version {sharedPlan.latestVersion.versionNumber}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(sharedPlan.latestVersion.uploadedAt).toLocaleString('de-DE')}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(sharedPlan.latestVersion.fileSize)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {sharedPlan.latestVersion.description && (
                  <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Beschreibung:</span> {sharedPlan.latestVersion.description}
                    </p>
                  </div>
                )}

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Wird heruntergeladen...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      PDF herunterladen
                    </>
                  )}
                </button>
              </div>

              {/* Info Box */}
              <div className="p-6 bg-amber-50 dark:bg-amber-900/20">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>Hinweis:</strong> Sie sehen immer die aktuellste Version dieses Plans. 
                  Wenn eine neue Version hochgeladen wird, erhalten Sie beim nächsten Zugriff automatisch die neueste Version.
                </p>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Für diesen Plan wurde noch keine Version hochgeladen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}