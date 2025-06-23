"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, CheckSquare, Clock, AlertCircle, Calendar, FolderOpen } from "lucide-react";
import { Modal } from "@/components/modal";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskActionsMenu } from "@/components/task-actions-menu";
import { SearchInput } from "@/components/search-input";
import { FilterDropdown, FilterOption } from "@/components/filter-dropdown";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
  projectNumber: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  Project: Project | null;
}

interface TaskListProps {
  initialTasks: Task[];
}

const statusOptions: FilterOption[] = [
  { value: 'TODO', label: 'Zu erledigen' },
  { value: 'IN_PROGRESS', label: 'In Bearbeitung' },
  { value: 'DONE', label: 'Erledigt' },
  { value: 'ARCHIVED', label: 'Archiviert' }
];

const priorityOptions: FilterOption[] = [
  { value: 'LOW', label: 'Niedrig' },
  { value: 'MEDIUM', label: 'Mittel' },
  { value: 'HIGH', label: 'Hoch' },
  { value: 'URGENT', label: 'Dringend' }
];

export function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const statusConfig = {
    TODO: { label: 'Zu erledigen', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: CheckSquare },
    IN_PROGRESS: { label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
    DONE: { label: 'Erledigt', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckSquare },
    ARCHIVED: { label: 'Archiviert', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500', icon: CheckSquare }
  };

  const priorityConfig = {
    LOW: { label: 'Niedrig', color: 'text-gray-500 dark:text-gray-400' },
    MEDIUM: { label: 'Mittel', color: 'text-yellow-600 dark:text-yellow-500' },
    HIGH: { label: 'Hoch', color: 'text-orange-600 dark:text-orange-500' },
    URGENT: { label: 'Dringend', color: 'text-red-600 dark:text-red-500' }
  };

  useEffect(() => {
    refreshTasks();
  }, [searchQuery, statusFilter, priorityFilter]);

  async function refreshTasks() {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      
      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Aufgaben:', error);
    }
  }

  function handleTaskCreated() {
    setIsModalOpen(false);
    refreshTasks();
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Aufgaben
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Neue Aufgabe
        </button>
      </div>

      {/* Such- und Filter-Leiste */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Aufgaben suchen..."
          className="flex-1"
        />
        <FilterDropdown
          label="Status"
          options={statusOptions}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as string)}
        />
        <FilterDropdown
          label="Priorität"
          options={priorityOptions}
          value={priorityFilter}
          onChange={(value) => setPriorityFilter(value as string)}
        />
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Noch keine Aufgaben vorhanden
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Erstellen Sie Ihre erste Aufgabe, um loszulegen.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Erste Aufgabe erstellen
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => {
              const status = statusConfig[task.status as keyof typeof statusConfig];
              const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={task.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  title="Doppelklick für Schnellansicht"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <StatusIcon className={`w-5 h-5 ${task.status === 'DONE' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`text-lg font-medium ${task.status === 'DONE' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {task.title}
                          </h3>
                          
                          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                            
                            <span className={`flex items-center gap-1 ${priority.color}`}>
                              <AlertCircle className="w-3.5 h-3.5" />
                              {priority.label}
                            </span>
                            
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 ${
                                new Date(task.dueDate) < new Date() && task.status !== 'DONE'
                                  ? 'text-red-600 dark:text-red-400 font-medium'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(task.dueDate).toLocaleDateString('de-DE')}
                              </span>
                            )}
                            
                            {task.Project && (
                              <Link
                                href={`/projects/${task.Project.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                {task.Project.projectNumber} - {task.Project.name}
                              </Link>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <TaskActionsMenu task={task} onUpdate={refreshTasks} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Neue Aufgabe erstellen"
      >
        <TaskForm
          mode="create"
          onSuccess={handleTaskCreated}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

    </>
  );
}