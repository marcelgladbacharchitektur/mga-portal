"use client";

import { useState, Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Edit, Trash2, MoreVertical, CheckCircle, Clock } from "lucide-react";
import { Modal } from "./modal";
import { TaskForm } from "./tasks/task-form";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string | null;
  Project: {
    id: string;
    name: string;
    projectNumber: string;
  } | null;
}

interface TaskActionsMenuProps {
  task: Task;
  onUpdate: () => void;
}

export function TaskActionsMenu({ task, onUpdate }: TaskActionsMenuProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Status:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete() {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Aufgabe:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  function handleEditSuccess() {
    setIsEditModalOpen(false);
    onUpdate();
  }

  const statusOptions = [
    { value: 'TODO', label: 'Zu erledigen', icon: Clock },
    { value: 'IN_PROGRESS', label: 'In Bearbeitung', icon: Clock },
    { value: 'DONE', label: 'Erledigt', icon: CheckCircle },
  ];

  return (
    <>
      <Menu as="div" className="relative">
        <Menu.Button 
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          disabled={isUpdating}
        >
          <MoreVertical className="w-5 h-5" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {/* Status ändern */}
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Status ändern
              </div>
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Menu.Item key={option.value}>
                    {({ active }) => (
                      <button
                        onClick={() => handleStatusChange(option.value)}
                        disabled={task.status === option.value}
                        className={`
                          ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}
                          ${task.status === option.value ? 'opacity-50 cursor-not-allowed' : ''}
                          flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    )}
                  </Menu.Item>
                );
              })}

              <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

              {/* Bearbeiten */}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className={`
                      ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}
                      flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                    `}
                  >
                    <Edit className="w-4 h-4" />
                    Bearbeiten
                  </button>
                )}
              </Menu.Item>

              {/* Löschen */}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className={`
                      ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}
                      flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400
                    `}
                  >
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Aufgabe bearbeiten"
      >
        <TaskForm
          mode="edit"
          task={task}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Aufgabe löschen"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Sind Sie sicher, dass Sie die Aufgabe <strong className="text-gray-900 dark:text-gray-100">&ldquo;{task.title}&rdquo;</strong> löschen möchten?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? 'Wird gelöscht...' : 'Löschen'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}