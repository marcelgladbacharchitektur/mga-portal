"use client";

import { useState } from "react";
import { Check } from "lucide-react";

interface QuickTaskUpdateProps {
  taskId: string;
  currentStatus: string;
  onUpdate: () => void;
}

export function QuickTaskUpdate({ taskId, currentStatus, onUpdate }: QuickTaskUpdateProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function markAsDone() {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DONE'
        }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Aufgabe:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  if (currentStatus === 'DONE') {
    return null;
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
      <button
        onClick={markAsDone}
        disabled={isUpdating}
        className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors disabled:opacity-50"
        title="Als erledigt markieren"
      >
        <Check className="w-4 h-4" />
      </button>
    </div>
  );
}