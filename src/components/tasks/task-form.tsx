"use client";

import { useState } from "react";
import { Calendar, AlertCircle } from "lucide-react";
import { ProjectCombobox } from "@/components/project-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TaskFormProps {
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    projectId: string | null;
  };
  mode: 'create' | 'edit';
  defaultProjectId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ task, mode, defaultProjectId, onSuccess, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [status, setStatus] = useState(task?.status || "TODO");
  const [priority, setPriority] = useState(task?.priority || "MEDIUM");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [projectId, setProjectId] = useState(task?.projectId || defaultProjectId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEditMode = mode === 'edit';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = isEditMode ? `/api/tasks/${task?.id}` : '/api/tasks';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          status,
          priority,
          dueDate: dueDate || null,
          projectId: projectId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Fehler beim ${isEditMode ? 'Aktualisieren' : 'Erstellen'} der Aufgabe`);
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
      <div>
        <Label htmlFor="title">
          Titel *
        </Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="z.B. Grundriss überarbeiten"
          className="mt-2"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="priority">
            Priorität
          </Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Priorität wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Niedrig</SelectItem>
              <SelectItem value="MEDIUM">Mittel</SelectItem>
              <SelectItem value="HIGH">Hoch</SelectItem>
              <SelectItem value="URGENT">Dringend</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">
            Status
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Status wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">Zu erledigen</SelectItem>
              <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
              <SelectItem value="DONE">Erledigt</SelectItem>
              <SelectItem value="ARCHIVED">Archiviert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="dueDate">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Fälligkeitsdatum
            </span>
          </Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="project">
            Projekt
          </Label>
          <div className="mt-2">
            <ProjectCombobox
              value={projectId}
              onChange={setProjectId}
              placeholder="Projekt auswählen (optional)"
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (isEditMode ? 'Wird aktualisiert...' : 'Wird erstellt...')
            : (isEditMode ? 'Aufgabe aktualisieren' : 'Aufgabe erstellen')
          }
        </Button>
      </div>
    </form>
  );
}