"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Building2, FileSpreadsheet, Calendar, Phone, Mail, ChevronRight, Clock, FileText, Download } from "lucide-react";

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string | null;
  TrackedPlan?: Array<{
    id: string;
    title: string;
    PlanVersion: Array<{
      id: string;
      versionNumber: number;
      uploadedAt: string;
    }>;
  }>;
}

export function ClientDashboard() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Projekte:', error);
    } finally {
      setLoading(false);
    }
  }

  const statusColors = {
    'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'ON_HOLD': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'COMPLETED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'ARCHIVED': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };

  const statusLabels = {
    'ACTIVE': 'In Bearbeitung',
    'ON_HOLD': 'Pausiert',
    'COMPLETED': 'Abgeschlossen',
    'ARCHIVED': 'Archiviert'
  };

  // Berechne aktuelle Uhrzeit für Begrüßung
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Guten Morgen' : currentHour < 18 ? 'Guten Tag' : 'Guten Abend';

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8"></div>
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map(i => (
                <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Persönliche Begrüßung */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {greeting}, {session?.user?.name || 'lieber Kunde'}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Willkommen in Ihrem persönlichen Projektbereich.
          </p>
        </div>

        {/* Projekte Übersicht */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Ihre Projekte
          </h2>
          
          {projects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Aktuell sind keine Projekte für Sie verfügbar.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-lg transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Projektnummer: {project.projectNumber}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status as keyof typeof statusColors]}`}>
                      {statusLabels[project.status as keyof typeof statusLabels]}
                    </span>
                  </div>

                  {/* Letzte Aktivität */}
                  {project.lastActivityAt && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <Clock className="w-4 h-4" />
                      Letzte Aktualisierung: {new Date(project.lastActivityAt).toLocaleDateString('de-DE')}
                    </div>
                  )}

                  {/* Plan-Updates */}
                  {project.TrackedPlan && project.TrackedPlan.length > 0 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <FileSpreadsheet className="w-4 h-4" />
                        Verfügbare Pläne:
                      </p>
                      <div className="space-y-1">
                        {project.TrackedPlan.slice(0, 2).map((plan) => (
                          <div key={plan.id} className="text-sm text-gray-700 dark:text-gray-300">
                            • {plan.title} 
                            {plan.PlanVersion.length > 0 && (
                              <span className="text-gray-500 dark:text-gray-400">
                                {' '}(Version {plan.PlanVersion[0].versionNumber})
                              </span>
                            )}
                          </div>
                        ))}
                        {project.TrackedPlan.length > 2 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            + {project.TrackedPlan.length - 2} weitere Pläne
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-4">
                    <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center gap-1">
                      Details anzeigen
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Kontaktinformationen */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Ihr Ansprechpartner
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Marcel Gladbach
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Architekt
                </p>
              </div>
              <div className="space-y-2">
                <a href="tel:+436641234567" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                  <Phone className="w-4 h-4" />
                  +43 664 123 4567
                </a>
                <a href="mailto:office@mga-portal.com" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                  <Mail className="w-4 h-4" />
                  office@mga-portal.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Öffnungszeiten
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Montag - Donnerstag</span>
                <span className="text-gray-900 dark:text-gray-100">08:00 - 17:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Freitag</span>
                <span className="text-gray-900 dark:text-gray-100">08:00 - 14:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Samstag & Sonntag</span>
                <span className="text-gray-900 dark:text-gray-100">Geschlossen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hilfetext */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            So nutzen Sie Ihr Portal
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-3">
            In diesem Portal können Sie jederzeit den aktuellen Stand Ihrer Projekte einsehen:
          </p>
          <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <li>• Projektinformationen und aktueller Status</li>
            <li>• Aktuelle Pläne und Dokumente</li>
            <li>• Aufgaben und Termine im Überblick</li>
            <li>• Direkte Downloadmöglichkeit für freigegebene Dokumente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}