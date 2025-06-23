"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactFormProps {
  mode?: 'create' | 'edit';
  contact?: {
    id: string;
    name: string;
    category: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContactForm({ mode = 'create', contact, onSuccess, onCancel }: ContactFormProps) {
  const [name, setName] = useState(contact?.name || "");
  const [category, setCategory] = useState(contact?.category || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    { value: "client", label: "Bauherr" },
    { value: "architect", label: "Architekt" },
    { value: "engineer", label: "Ingenieur" },
    { value: "contractor", label: "Unternehmer" },
    { value: "authority", label: "Behörde" },
    { value: "other", label: "Sonstige" }
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = mode === 'edit' && contact 
        ? `/api/contact-groups/${contact.id}`
        : '/api/contact-groups';
      
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          category
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Fehler beim ${mode === 'edit' ? 'Aktualisieren' : 'Erstellen'} des Kontakts`);
      }

      await response.json();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="z.B. Müller Architekten GmbH"
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Kategorie *
        </label>
        <Select
          value={category}
          onValueChange={(value) => setCategory(value)}
          required
        >
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Kategorie wählen..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.label}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !category}
          className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (mode === 'edit' ? 'Wird aktualisiert...' : 'Wird erstellt...') : (mode === 'edit' ? 'Kontakt aktualisieren' : 'Kontakt erstellen')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}