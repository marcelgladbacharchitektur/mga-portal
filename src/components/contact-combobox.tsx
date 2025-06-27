"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Plus } from "lucide-react";

interface ContactGroup {
  id: string;
  name: string;
  category: string;
}

interface ContactComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ContactCombobox({ value, onChange, placeholder = "Kontakt auswählen..." }: ContactComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContactGroups();
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

  async function fetchContactGroups() {
    setLoading(true);
    try {
      const response = await fetch('/api/contact-groups');
      if (response.ok) {
        const data = await response.json();
        setContactGroups(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kontakte:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNew() {
    if (!newName.trim() || !newCategory.trim()) return;

    try {
      const response = await fetch('/api/contact-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          category: newCategory
        })
      });

      if (response.ok) {
        const newContactGroup = await response.json();
        setContactGroups([...contactGroups, newContactGroup]);
        onChange(newContactGroup.id);
        setNewName("");
        setNewCategory("");
        setShowCreateNew(false);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Kontakts:', error);
    }
  }

  const filteredGroups = contactGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedGroup = contactGroups.find(g => g.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 flex items-center justify-between"
      >
        <span className={selectedGroup ? "" : "text-gray-400"}>
          {selectedGroup ? `${selectedGroup.name} (${selectedGroup.category})` : placeholder}
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
            <div className="p-4 text-center text-gray-500">Lade Kontakte...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Keine Kontakte gefunden
            </div>
          ) : (
            <div className="py-1">
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    onChange(group.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                >
                  <span className="font-medium">{group.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{group.category}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            {!showCreateNew ? (
              <button
                type="button"
                onClick={() => setShowCreateNew(true)}
                className="w-full px-3 py-2 text-left text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Neuen Kontakt erstellen
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Kategorie (z.B. Bauherr, Architekt)"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    disabled={!newName.trim() || !newCategory.trim()}
                    className="flex-1 px-2 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Erstellen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateNew(false);
                      setNewName("");
                      setNewCategory("");
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}