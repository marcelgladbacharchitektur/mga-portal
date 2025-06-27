"use client";

import { useState, useEffect } from "react";
import { Plus, User, Mail, Phone, Edit, Trash2, MoreVertical } from "lucide-react";
import { Menu } from "@headlessui/react";
import { Modal } from "@/components/modal";
import { PersonForm } from "@/components/contacts/person-form";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  position?: string;
  contactGroupId?: string;
  createdAt: string;
  ContactGroup?: {
    id: string;
    name: string;
    category: string;
  };
  EmailAddress: Array<{
    id: string;
    email: string;
    emailType: string;
    isPrimary: boolean;
  }>;
  PhoneNumber: Array<{
    id: string;
    number: string;
    phoneType: string;
    isPrimary: boolean;
  }>;
}

export function PersonsList() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingPerson, setCreatingPerson] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);

  useEffect(() => {
    fetchPersons();
  }, []);

  async function fetchPersons() {
    try {
      const response = await fetch('/api/persons');
      if (response.ok) {
        const data = await response.json();
        setPersons(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Personen:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingPerson) return;

    try {
      const response = await fetch(`/api/persons/${deletingPerson.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPersons();
        setDeletingPerson(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Fehler beim Löschen der Person');
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Person:', error);
    }
  }

  const getPrimaryEmail = (person: Person) => {
    return person.EmailAddress.find(e => e.isPrimary)?.email || person.EmailAddress[0]?.email;
  };

  const getPrimaryPhone = (person: Person) => {
    return person.PhoneNumber.find(p => p.isPrimary)?.number || person.PhoneNumber[0]?.number;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header mit Erstellen-Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-600 dark:text-gray-400">
            {persons.length} {persons.length === 1 ? 'Person' : 'Personen'} im System
          </p>
        </div>
        <button
          onClick={() => setCreatingPerson(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Neue Person
        </button>
      </div>

      {persons.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Noch keine Personen
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Erstellen Sie die erste Person im System.
          </p>
          <button
            onClick={() => setCreatingPerson(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Erste Person erstellen
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {persons.map((person) => (
            <div
              key={person.id}
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {person.title && `${person.title} `}
                    {person.firstName} {person.lastName}
                  </h3>
                  {person.position && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {person.position}
                    </p>
                  )}
                </div>
                <Menu as="div" className="relative">
                  <Menu.Button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setEditingPerson(person)}
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
                          onClick={() => setDeletingPerson(person)}
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

              {/* Kontaktinformationen */}
              <div className="space-y-2 mb-3">
                {getPrimaryEmail(person) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{getPrimaryEmail(person)}</span>
                  </div>
                )}
                {getPrimaryPhone(person) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{getPrimaryPhone(person)}</span>
                  </div>
                )}
              </div>

              {/* Gruppenzugehörigkeit */}
              {person.ContactGroup && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gruppe: <span className="font-medium">{person.ContactGroup.name}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {creatingPerson && (
        <Modal
          isOpen={true}
          onClose={() => setCreatingPerson(false)}
          title="Neue Person erstellen"
          size="xl"
        >
          <PersonForm
            mode="create"
            onSuccess={() => {
              setCreatingPerson(false);
              fetchPersons();
            }}
            onCancel={() => setCreatingPerson(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editingPerson && (
        <Modal
          isOpen={true}
          onClose={() => setEditingPerson(null)}
          title="Person bearbeiten"
          size="xl"
        >
          <PersonForm
            mode="edit"
            person={editingPerson}
            onSuccess={() => {
              setEditingPerson(null);
              fetchPersons();
            }}
            onCancel={() => setEditingPerson(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPerson && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingPerson(null)}
          title="Person löschen"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Sind Sie sicher, dass Sie <strong className="text-gray-900 dark:text-gray-100">
                {deletingPerson.firstName} {deletingPerson.lastName}
              </strong> löschen möchten?
            </p>
            {deletingPerson.ContactGroup && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Diese Person ist Mitglied der Gruppe "{deletingPerson.ContactGroup.name}".
              </p>
            )}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setDeletingPerson(null)}
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