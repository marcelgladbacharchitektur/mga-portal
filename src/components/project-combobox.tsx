"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";

interface Project {
  id: string;
  name: string;
  projectNumber: string;
  status: string;
}

interface ProjectComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ProjectCombobox({ value, onChange, placeholder = "Projekt auswählen..." }: ProjectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.filter((p: Project) => p.status === 'ACTIVE' || p.status === 'ON_HOLD'));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Projekte:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.projectNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProject = projects.find(p => p.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 flex items-center justify-between"
      >
        <span className={selectedProject ? "" : "text-gray-400"}>
          {selectedProject ? `${selectedProject.projectNumber} - ${selectedProject.name}` : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Suchen..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-4 text-center text-gray-500">Lade Projekte...</div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${!value ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
              >
                <span className="text-gray-500 dark:text-gray-400">Kein Projekt</span>
              </button>
              
              {filteredProjects.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Keine Projekte gefunden
                </div>
              ) : (
                <div className="py-1">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        onChange(project.id);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center ${value === project.id ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                    >
                      <span className="font-medium">{project.projectNumber} - {project.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {project.status === 'ON_HOLD' ? 'Pausiert' : 'Aktiv'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}