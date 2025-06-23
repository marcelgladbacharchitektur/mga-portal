"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Users, CheckSquare, FileText, Calendar, Euro, Activity, FileSpreadsheet } from "lucide-react";
import { TrackedPlansList } from "@/components/tracked-plans-list";
import { ProjectDocuments } from "@/components/project-documents";
import { ProjectParticipants } from "@/components/projects/project-participants";
import { ProjectTasks } from "@/components/projects/project-tasks";
import { useSession } from "next-auth/react";

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  budget: number | null;
  projectType: string;
  projectSector: string;
  parcelNumber: string | null;
  plotAddress: string | null;
  plotArea: number | null;
  cadastralCommunity: string | null;
  registrationNumber: string | null;
  zoning: string | null;
  plotNotes: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string | null;
  nextcloudPath: string | null;
  Task: any[];
  ProjectParticipant: any[];
}

export default function ProjectPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'tasks' | 'documents' | 'plans'>('overview');
  const [loading, setLoading] = useState(true);
  
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  async function fetchProject() {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (!response.ok) throw new Error('Projekt konnte nicht geladen werden');
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Fehler beim Laden des Projekts:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Projekt nicht gefunden</p>
            <Link href="/projects" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
              Zurück zu Projekte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ON_HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };

  const statusLabels = {
    ACTIVE: 'Aktiv',
    ON_HOLD: 'Pausiert',
    COMPLETED: 'Abgeschlossen',
    ARCHIVED: 'Archiviert'
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation zurück */}
        <div className="mb-6">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zu Projekte
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {project.name}
                </h1>
                <span className="text-2xl font-mono text-gray-500 dark:text-gray-400">
                  #{project.projectNumber}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Erstellt am {new Date(project.createdAt).toLocaleDateString('de-DE')}
                </span>
                {project.lastActivityAt && (
                  <span className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Letzte Aktivität: {new Date(project.lastActivityAt).toLocaleDateString('de-DE')}
                  </span>
                )}
              </div>
            </div>
            {isAdmin && (
              <Link
                href={`/projects/${params.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Bearbeiten
              </Link>
            )}
          </div>

          {/* Status und Budget */}
          <div className="flex items-center gap-6">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Status</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status as keyof typeof statusColors]}`}>
                {statusLabels[project.status as keyof typeof statusLabels]}
              </span>
            </div>
            {project.budget && (
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Budget</span>
                <span className="flex items-center gap-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  <Euro className="w-4 h-4" />
                  {project.budget.toLocaleString('de-DE')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab-Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex gap-6">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Übersicht
            </button>
            <button 
              onClick={() => setActiveTab('participants')}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'participants' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Teilnehmer
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'tasks' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Aufgaben
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'documents' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Dokumente
            </button>
            <button 
              onClick={() => setActiveTab('plans')}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'plans' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Pläne
            </button>
          </nav>
        </div>

        {/* Content - Conditional Rendering based on activeTab */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Hauptbereich */}
            <div className="lg:col-span-2 space-y-6">
              {/* Teilnehmer Platzhalter */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Projektteilnehmer
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {project.ProjectParticipant.length > 0 
                    ? `${project.ProjectParticipant.length} Teilnehmer`
                    : 'Noch keine Teilnehmer hinzugefügt'}
                </p>
                <button className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                  + Teilnehmer hinzufügen
                </button>
              </div>

              {/* Aufgaben Platzhalter */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Aufgaben
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {project.Task.length > 0 
                    ? `${project.Task.length} Aufgaben`
                    : 'Noch keine Aufgaben erstellt'}
                </p>
                <button className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                  + Neue Aufgabe
                </button>
              </div>
            </div>

            {/* Seitenbereich */}
            <div className="space-y-6">
              {/* Projekt-Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Projektinformationen
                </h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Projektnummer</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.projectNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Projekttyp</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{
                        RESIDENTIAL: 'Wohnbau',
                        COMMERCIAL: 'Gewerbe',
                        PUBLIC: 'Öffentlich',
                        INDUSTRIAL: 'Industrie',
                        RENOVATION: 'Sanierung',
                        OTHER: 'Sonstiges'
                      }[project.projectType] || project.projectType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Projektsektor</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{
                        NEW_CONSTRUCTION: 'Neubau',
                        RENOVATION: 'Umbau',
                        EXTENSION: 'Erweiterung',
                        CONVERSION: 'Umnutzung',
                        RESTORATION: 'Restaurierung',
                        OTHER: 'Sonstiges'
                      }[project.projectSector] || project.projectSector}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Erstellt am</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(project.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Aktualisiert am</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(project.updatedAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </dd>
                  </div>
                  {project.nextcloudPath && (
                    <div>
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Nextcloud Pfad</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.nextcloudPath}</dd>
                    </div>
                  )}
                </dl>
              </div>
              
              {/* Grundstücksinformationen */}
              {(project.parcelNumber || project.plotAddress || project.plotArea || project.cadastralCommunity || project.landRegistry || project.registrationNumber || project.zoning || project.plotNotes) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Grundstücksinformationen
                  </h2>
                  <dl className="space-y-3">
                    {project.plotAddress && (
                      <div>
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Adresse</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.plotAddress}</dd>
                      </div>
                    )}
                    {project.parcelNumber && (
                      <div>
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Grundstücksnummer</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.parcelNumber}</dd>
                      </div>
                    )}
                    {project.plotArea && (
                      <div>
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Fläche</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.plotArea.toLocaleString('de-DE')} m²</dd>
                      </div>
                    )}
                    {project.cadastralCommunity && (
                      <div>
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Katastralgemeinde</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.cadastralCommunity}</dd>
                      </div>
                    )}
                    {project.landRegistry && (
                      <div>
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Grundbuch</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.landRegistry}</dd>
                      </div>
                    )}
                    {project.registrationNumber && (
                      <div>
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Einlagezahl (EZ)</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.registrationNumber}</dd>
                      </div>
                    )}
                    {project.zoning && (
                      <div>
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Flächenwidmung</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.zoning}</dd>
                      </div>
                    )}
                    {project.plotNotes && (
                      <div>
                        <dt className="text-sm text-gray-600 dark:text-gray-400">Notizen</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{project.plotNotes}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Dokumente Platzhalter */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Dokumente
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Noch keine Dokumente hochgeladen
                </p>
                <button className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                  + Dokument hochladen
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <TrackedPlansList projectId={project.id} />
        )}

        {activeTab === 'participants' && (
          <ProjectParticipants projectId={project.id} />
        )}

        {activeTab === 'tasks' && (
          <ProjectTasks projectId={project.id} />
        )}

        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Projektdokumente
            </h2>
            <ProjectDocuments projectId={params.id as string} />
          </div>
        )}
      </div>
    </div>
  );
}