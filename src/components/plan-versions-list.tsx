"use client";

import { useState, useEffect } from "react";
import { FileUp, Download, Share2, Clock, User, FileText, Plus } from "lucide-react";
import { UploadVersionDialog } from "./upload-version-dialog";

interface PlanVersion {
  id: string;
  versionNumber: number;
  filePath: string;
  description: string | null;
  fileSize: number | null;
  uploadedAt: string;
  uploadedBy: string | null;
}

interface PlanVersionsListProps {
  trackedPlanId: string;
  projectId: string;
  onVersionsChange?: () => void;
}

export function PlanVersionsList({ trackedPlanId, projectId, onVersionsChange }: PlanVersionsListProps) {
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [trackedPlanId]);

  async function fetchVersions() {
    try {
      const response = await fetch(`/api/plans/${trackedPlanId}/versions`);
      if (!response.ok) throw new Error('Versionen konnten nicht geladen werden');
      const data = await response.json();
      setVersions(data);
    } catch (error) {
      console.error('Fehler beim Laden der Versionen:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadVersion(file: File, description?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    try {
      const response = await fetch(`/api/plans/${trackedPlanId}/versions`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Version konnte nicht hochgeladen werden');
      
      await fetchVersions();
      if (onVersionsChange) onVersionsChange();
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Fehler beim Hochladen der Version:', error);
    }
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Versionen ({versions.length})
        </h3>
        <button
          onClick={() => setIsUploadDialogOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Neue Version hochladen
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <FileUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Noch keine Versionen hochgeladen
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((version) => (
            <div
              key={version.id}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Version {version.versionNumber}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      • {formatFileSize(version.fileSize)}
                    </span>
                  </div>
                  {version.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-6">
                      {version.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2 ml-6">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(version.uploadedAt).toLocaleString('de-DE')}
                    </span>
                    {version.uploadedBy && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.uploadedBy}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/plans/versions/${version.id}/download`}
                    download
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors inline-block"
                    title="Herunterladen"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                    title="Teilen"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <UploadVersionDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onSubmit={handleUploadVersion}
        nextVersionNumber={versions.length + 1}
      />
    </div>
  );
}