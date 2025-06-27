"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FolderOpen, Calendar, Hash, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Menu } from "@headlessui/react";
import { Modal } from "@/components/modal";
import { ProjectForm } from "@/components/projects/project-form";
import { useSession } from "next-auth/react";
import { SearchInput } from "@/components/search-input";
import { FilterDropdown, FilterOption } from "@/components/filter-dropdown";

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  budget: number | null;
  createdAt: string;
  updatedAt: string;
}

const statusOptions: FilterOption[] = [
  { value: 'ACTIVE', label: 'Aktiv' },
  { value: 'ON_HOLD', label: 'Pausiert' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
  { value: 'ARCHIVED', label: 'Archiviert' }
];

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchProjects();
  }, [searchQuery, statusFilter]);

  async function fetchProjects() {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/projects?${params.toString()}`);
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

  async function handleDelete() {
    if (!deletingProject) return;

    try {
      const response = await fetch(`/api/projects/${deletingProject.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProjects();
        setDeletingProject(null);
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Projekts:', error);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Projekte
          </h1>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Neues Projekt
          </Link>
        </div>

        {/* Such- und Filter-Leiste */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Projekte suchen..."
            className="flex-1"
          />
          <FilterDropdown
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as string)}
          />
        </div>

        {projects.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Noch keine Projekte vorhanden
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isAdmin ? 'Erstellen Sie Ihr erstes Projekt, um loszulegen.' : 'Noch keine Projekte für Sie verfügbar.'}
            </p>
            {isAdmin && (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Erstes Projekt erstellen
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="relative group">
                <div
                  className="cursor-pointer"
                  title="Doppelklick für Schnellansicht"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {project.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-sm font-mono text-gray-500 dark:text-gray-400">
                        <Hash className="w-3 h-3" />
                        {project.projectNumber}
                      </span>
                    </div>
                    
                    {project.budget && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Budget: €{project.budget.toLocaleString('de-DE')}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : project.status === 'ON_HOLD'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : project.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {project.status === 'ACTIVE' ? 'Aktiv' : 
                         project.status === 'ON_HOLD' ? 'Pausiert' :
                         project.status === 'COMPLETED' ? 'Abgeschlossen' :
                         project.status === 'ARCHIVED' ? 'Archiviert' : project.status}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Menu */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Menu as="div" className="relative">
                      <Menu.Button 
                        onClick={(e) => e.preventDefault()}
                        className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingProject(project);
                            }}
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                          >
                            <Edit className="w-4 h-4" />
                            Bearbeiten
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setDeletingProject(project);
                            }}
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400`}
                          >
                            <Trash2 className="w-4 h-4" />
                            Löschen
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProject && (
        <Modal
          isOpen={true}
          onClose={() => setEditingProject(null)}
          title="Projekt bearbeiten"
        >
          <ProjectForm
            mode="edit"
            project={editingProject}
            onSuccess={() => {
              setEditingProject(null);
              fetchProjects();
            }}
            onCancel={() => setEditingProject(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingProject(null)}
          title="Projekt löschen"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Sind Sie sicher, dass Sie das Projekt <strong className="text-gray-900 dark:text-gray-100">&ldquo;{deletingProject.name}&rdquo;</strong> (#{deletingProject.projectNumber}) löschen möchten?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              Warnung: Alle zugehörigen Aufgaben und Daten werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setDeletingProject(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}