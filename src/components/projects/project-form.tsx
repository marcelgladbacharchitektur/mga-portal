"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, X, UserPlus } from "lucide-react";
import { ContactCombobox } from "@/components/contact-combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectParticipant {
  id: string;
  role: string;
  ContactGroup: {
    id: string;
    name: string;
    category: string;
  };
}

interface ProjectFormProps {
  project?: {
    id: string;
    name: string;
    status: string;
    budget: number | null;
    projectType?: string;
    projectSector?: string;
    parcelNumber?: string | null;
    plotAddress?: string | null;
    plotArea?: number | null;
    cadastralCommunity?: string | null;
    registrationNumber?: string | null;
    zoning?: string | null;
    plotNotes?: string | null;
  };
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ project, mode, onSuccess, onCancel }: ProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState(project?.name || "");
  const [budget, setBudget] = useState(project?.budget?.toString() || "");
  const [status, setStatus] = useState(project?.status || "ACTIVE");
  const [projectType, setProjectType] = useState(project?.projectType || "RESIDENTIAL");
  const [projectSector, setProjectSector] = useState(project?.projectSector || "NEW_CONSTRUCTION");
  // Grundstücksinformationen
  const [parcelNumber, setParcelNumber] = useState(project?.parcelNumber || "");
  const [plotAddress, setPlotAddress] = useState(project?.plotAddress || "");
  const [plotArea, setPlotArea] = useState(project?.plotArea?.toString() || "");
  const [cadastralCommunity, setCadastralCommunity] = useState(project?.cadastralCommunity || "");
  const [landRegistry, setLandRegistry] = useState(project?.landRegistry || "");
  const [registrationNumber, setRegistrationNumber] = useState(project?.registrationNumber || "");
  const [zoning, setZoning] = useState(project?.zoning || "");
  const [plotNotes, setPlotNotes] = useState(project?.plotNotes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Teilnehmer-Verwaltung
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [participantRole, setParticipantRole] = useState("");
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const isEditMode = mode === 'edit';
  const projectId = project?.id;

  useEffect(() => {
    if (isEditMode && projectId) {
      fetchParticipants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, projectId]);

  async function fetchParticipants() {
    setLoadingParticipants(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Teilnehmer:', error);
    } finally {
      setLoadingParticipants(false);
    }
  }

  async function handleAddParticipant() {
    if (!selectedContactId || !participantRole.trim()) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactGroupId: selectedContactId,
          role: participantRole
        })
      });

      if (response.ok) {
        const newParticipant = await response.json();
        setParticipants([...participants, newParticipant]);
        setSelectedContactId("");
        setParticipantRole("");
      } else {
        const data = await response.json();
        alert(data.error || 'Fehler beim Hinzufügen des Teilnehmers');
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Teilnehmers:', error);
    }
  }

  async function handleRemoveParticipant(participantId: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}/participants?participantId=${participantId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setParticipants(participants.filter(p => p.id !== participantId));
      }
    } catch (error) {
      console.error('Fehler beim Entfernen des Teilnehmers:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = isEditMode ? `/api/projects/${projectId}` : '/api/projects';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          budget: budget ? parseFloat(budget) : null,
          status: isEditMode ? status : undefined,
          projectType,
          projectSector,
          parcelNumber: parcelNumber || null,
          plotAddress: plotAddress || null,
          plotArea: plotArea ? parseFloat(plotArea) : null,
          cadastralCommunity: cadastralCommunity || null,
          landRegistry: landRegistry || null,
          registrationNumber: registrationNumber || null,
          zoning: zoning || null,
          plotNotes: plotNotes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Fehler beim ${isEditMode ? 'Aktualisieren' : 'Erstellen'} des Projekts`);
      }

      await response.json();
      
      // Callback nach Erfolg
      if (onSuccess) {
        onSuccess();
      } else {
        // Fallback zur Navigation
        if (isEditMode) {
          router.push(`/projects/${projectId}`);
        } else {
          router.push('/projects');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Projektname *</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="z.B. Villa Müller"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="projectType"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Projekttyp *
          </label>
          <Select
            value={projectType}
            onValueChange={(value) => setProjectType(value)}
          >
            <SelectTrigger id="projectType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RESIDENTIAL">Wohnbau</SelectItem>
              <SelectItem value="COMMERCIAL">Gewerbe</SelectItem>
              <SelectItem value="PUBLIC">Öffentlich</SelectItem>
              <SelectItem value="INDUSTRIAL">Industrie</SelectItem>
              <SelectItem value="RENOVATION">Sanierung</SelectItem>
              <SelectItem value="OTHER">Sonstiges</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label
            htmlFor="projectSector"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Projektsektor *
          </label>
          <Select
            value={projectSector}
            onValueChange={(value) => setProjectSector(value)}
          >
            <SelectTrigger id="projectSector" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEW_CONSTRUCTION">Neubau</SelectItem>
              <SelectItem value="RENOVATION">Umbau</SelectItem>
              <SelectItem value="EXTENSION">Erweiterung</SelectItem>
              <SelectItem value="CONVERSION">Umnutzung</SelectItem>
              <SelectItem value="RESTORATION">Restaurierung</SelectItem>
              <SelectItem value="OTHER">Sonstiges</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Budget (€)</Label>
        <Input
          id="budget"
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          step="0.01"
          min="0"
          placeholder="50000"
        />
      </div>

      {/* Grundstücksinformationen */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Grundstücksinformationen
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="parcelNumber">Grundstücksnummer</Label>
            <Input
              id="parcelNumber"
              type="text"
              value={parcelNumber}
              onChange={(e) => setParcelNumber(e.target.value)}
              placeholder="z.B. 123/4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plotArea">Grundstücksfläche (m²)</Label>
            <Input
              id="plotArea"
              type="number"
              value={plotArea}
              onChange={(e) => setPlotArea(e.target.value)}
              step="0.01"
              min="0"
              placeholder="z.B. 1200"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="plotAddress">Grundstücksadresse</Label>
            <Input
              id="plotAddress"
              type="text"
              value={plotAddress}
              onChange={(e) => setPlotAddress(e.target.value)}
              placeholder="z.B. Musterstraße 1, 12345 Musterstadt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cadastralCommunity">Katastralgemeinde</Label>
            <Input
              id="cadastralCommunity"
              type="text"
              value={cadastralCommunity}
              onChange={(e) => setCadastralCommunity(e.target.value)}
              placeholder="z.B. Wien-Innere Stadt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landRegistry">Grundbuch</Label>
            <Input
              id="landRegistry"
              type="text"
              value={landRegistry}
              onChange={(e) => setLandRegistry(e.target.value)}
              placeholder="z.B. BG Innere Stadt Wien"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Einlagezahl (EZ)</Label>
            <Input
              id="registrationNumber"
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="z.B. 1234"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoning">Flächenwidmung</Label>
            <Input
              id="zoning"
              type="text"
              value={zoning}
              onChange={(e) => setZoning(e.target.value)}
              placeholder="z.B. Bauland-Wohngebiet"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="plotNotes">Grundstücksnotizen</Label>
            <Textarea
              id="plotNotes"
              value={plotNotes}
              onChange={(e) => setPlotNotes(e.target.value)}
              rows={3}
              placeholder="Besonderheiten, Altlasten, etc."
            />
          </div>
        </div>
      </div>

      {isEditMode && (
        <>
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Status
            </label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value)}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Aktiv</SelectItem>
                <SelectItem value="ON_HOLD">Pausiert</SelectItem>
                <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                <SelectItem value="ARCHIVED">Archiviert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Teilnehmer-Verwaltung */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Projektteilnehmer
            </h3>

            <div className="space-y-4">
              {/* Neue Teilnehmer hinzufügen */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kontakt
                    </label>
                    <ContactCombobox
                      value={selectedContactId}
                      onChange={setSelectedContactId}
                      placeholder="Kontakt auswählen..."
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rolle
                    </label>
                    <Input
                      type="text"
                      value={participantRole}
                      onChange={(e) => setParticipantRole(e.target.value)}
                      placeholder="z.B. Bauherr"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddParticipant}
                      disabled={!selectedContactId || !participantRole.trim()}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Hinzufügen
                    </button>
                  </div>
                </div>
              </div>

              {/* Teilnehmer-Liste */}
              {loadingParticipants ? (
                <div className="text-center py-4 text-gray-500">Lade Teilnehmer...</div>
              ) : participants.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Noch keine Teilnehmer hinzugefügt
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {participant.ContactGroup.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {participant.role} • {participant.ContactGroup.category}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting 
            ? (isEditMode ? 'Wird aktualisiert...' : 'Wird erstellt...') 
            : (isEditMode ? 'Projekt aktualisieren' : 'Projekt erstellen')}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Abbrechen
          </button>
        ) : (
          <Link
            href={isEditMode ? `/projects/${projectId}` : '/projects'}
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Abbrechen
          </Link>
        )}
      </div>
    </form>
  );
}