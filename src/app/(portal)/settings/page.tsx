'use client'

import dynamic from 'next/dynamic'

import { Settings, Cloud, FolderTree, Bell, Shield, Palette, Clock, Calendar, CalendarDays } from "lucide-react";
import { NextcloudStatus } from "@/components/nextcloud-status";
import { WorkingHoursManager } from "@/components/working-hours-manager";
// Dynamically import components that might cause hydration issues
const GoogleCalendarConnect = dynamic(
  () => import('@/components/google-calendar-connect').then(mod => mod.GoogleCalendarConnect),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }
)

const AppointmentTypesManager = dynamic(
  () => import('@/components/appointment-types-manager').then(mod => mod.AppointmentTypesManager),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }
)

const BookingLinkDisplay = dynamic(
  () => import('@/components/booking-link-display').then(mod => mod.BookingLinkDisplay),
  { ssr: false }
)

const DynamicCalendarManager = dynamic(
  () => import('@/components/dynamic-calendar-manager').then(mod => mod.DynamicCalendarManager),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }
)

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Show success/error messages from OAuth callback
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success) {
      toast.success(success);
    } else if (error) {
      toast.error(error);
    }
  }, [searchParams]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Einstellungen
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verwalten Sie die Systemkonfiguration und Integrationen
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Granulare Arbeitszeiten */}
          <div className="lg:col-span-2">
            <WorkingHoursManager />
          </div>

          {/* Buchungslink */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Terminbuchung
            </h2>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Buchungslink</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Teilen Sie diesen Link, damit Kunden Termine bei Ihnen buchen können:
              </p>
              <BookingLinkDisplay />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Die Buchungsseite ist öffentlich zugänglich und benötigt keinen Login.
              </p>
            </div>
          </div>

          {/* Google Calendar & Termintypen */}
          <div className="lg:col-span-2">
            <GoogleCalendarConnect />
          </div>

          <div className="lg:col-span-2">
            <DynamicCalendarManager />
          </div>

          <div className="lg:col-span-2">
            <AppointmentTypesManager />
          </div>

          {/* Nextcloud Integration */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Cloud className="w-6 h-6" />
              Nextcloud Integration
            </h2>
            <NextcloudStatus />
          </div>

          {/* Allgemeine Einstellungen */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FolderTree className="w-5 h-5" />
              Ordnerstruktur
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Konfigurieren Sie die Standard-Ordnerstruktur für neue Projekte in Nextcloud.
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <code className="text-sm text-gray-700 dark:text-gray-300">01_Admin</code>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <code className="text-sm text-gray-700 dark:text-gray-300">02_Pläne</code>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <code className="text-sm text-gray-700 dark:text-gray-300">03_Korrespondenz</code>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <code className="text-sm text-gray-700 dark:text-gray-300">04_Fotos</code>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <code className="text-sm text-gray-700 dark:text-gray-300">05_Berechnungen</code>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <code className="text-sm text-gray-700 dark:text-gray-300">06_Ausschreibung</code>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <code className="text-sm text-gray-700 dark:text-gray-300">07_Verträge</code>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <code className="text-sm text-gray-700 dark:text-gray-300">08_Protokolle</code>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Die Ordnerstruktur kann in einer zukünftigen Version angepasst werden.
            </p>
          </div>

          {/* Benachrichtigungen */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Benachrichtigungen
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Konfigurieren Sie, wann und wie Sie benachrichtigt werden möchten.
            </p>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md cursor-not-allowed opacity-50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  E-Mail-Benachrichtigungen
                </span>
                <input type="checkbox" disabled className="rounded" />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md cursor-not-allowed opacity-50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fälligkeitserinnerungen
                </span>
                <input type="checkbox" disabled className="rounded" />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md cursor-not-allowed opacity-50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Projekt-Updates
                </span>
                <input type="checkbox" disabled className="rounded" />
              </label>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Benachrichtigungen werden in einer zukünftigen Version verfügbar sein.
            </p>
          </div>

          {/* Sicherheit */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sicherheit
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Verwalten Sie Sicherheitseinstellungen für Ihr Portal.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Zwei-Faktor-Authentifizierung
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Kommt bald
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Session-Timeout
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Automatisch nach 30 Minuten Inaktivität
                </p>
              </div>
            </div>
          </div>

          {/* Erscheinungsbild */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Erscheinungsbild
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Passen Sie das Aussehen des Portals an.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dark Mode
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Folgt den Systemeinstellungen
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kompakte Ansicht
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Kommt bald
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>MGA Portal</strong> • Version 1.0.0 • © 2024 Marcel Gladbach Architektur
          </p>
        </div>
      </div>
    </div>
  );
}