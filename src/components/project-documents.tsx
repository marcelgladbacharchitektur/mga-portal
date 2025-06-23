"use client";

import { useState, useEffect } from "react";
import { 
  File, 
  Folder, 
  Download, 
  ChevronRight, 
  FileText, 
  Image, 
  FileSpreadsheet,
  Film,
  Archive,
  AlertCircle,
  RefreshCw,
  FolderOpen
} from "lucide-react";

interface Document {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  lastModified: Date;
  mimeType?: string;
}

interface ProjectDocumentsProps {
  projectId: string;
}

export function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const [folders, setFolders] = useState<Document[]>([]);
  const [files, setFiles] = useState<Document[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [projectPath, setProjectPath] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string; path: string }[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  async function fetchDocuments(folderPath?: string) {
    setLoading(true);
    setError(null);
    
    try {
      const url = `/api/projects/${projectId}/documents`;
      const response = folderPath 
        ? await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderPath })
          })
        : await fetch(url);

      if (!response.ok) throw new Error('Fehler beim Laden der Dokumente');
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setFolders([]);
        setFiles([]);
      } else {
        setFolders(data.folders || []);
        setFiles(data.files || []);
        setCurrentPath(data.currentPath || data.projectPath || "");
        
        if (data.projectPath) {
          setProjectPath(data.projectPath);
          updateBreadcrumbs(folderPath || data.projectPath, data.projectPath);
        } else if (folderPath) {
          updateBreadcrumbs(folderPath, projectPath);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Dokumente:', error);
      setError('Dokumente konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }

  function updateBreadcrumbs(currentPath: string, basePath: string) {
    if (!basePath || !currentPath) return;
    
    const relativePath = currentPath.replace(basePath, '');
    const parts = relativePath.split('/').filter(Boolean);
    
    const crumbs = [{ name: 'Projektordner', path: basePath }];
    let path = basePath;
    
    parts.forEach(part => {
      path = `${path}/${part}`;
      crumbs.push({ name: part, path });
    });
    
    setBreadcrumbs(crumbs);
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getFileIcon(mimeType?: string, name?: string) {
    if (!mimeType && name) {
      const ext = name.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
        return <Image className="w-5 h-5 text-green-600" aria-hidden="true" />;
      }
      if (['pdf'].includes(ext || '')) {
        return <FileText className="w-5 h-5 text-red-600" />;
      }
      if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      }
      if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) {
        return <Film className="w-5 h-5 text-purple-600" />;
      }
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
        return <Archive className="w-5 h-5 text-yellow-600" />;
      }
    }
    
    if (mimeType?.startsWith('image/')) {
      return <Image className="w-5 h-5 text-green-600" aria-hidden="true" />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    if (mimeType?.startsWith('video/')) {
      return <Film className="w-5 h-5 text-purple-600" />;
    }
    if (mimeType?.includes('zip') || mimeType?.includes('compressed')) {
      return <Archive className="w-5 h-5 text-yellow-600" />;
    }
    
    return <File className="w-5 h-5 text-gray-500" />;
  }

  async function navigateToFolder(folderPath: string) {
    await fetchDocuments(folderPath);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-3" />
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={() => fetchDocuments(currentPath)}
          className="mt-4 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 text-center">
        <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Keine Dokumente vorhanden
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Laden Sie Dateien über Nextcloud hoch, um sie hier anzuzeigen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 overflow-x-auto">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
              <button
                onClick={() => navigateToFolder(crumb.path)}
                className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors whitespace-nowrap"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ordner */}
      {folders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ordner
          </h3>
          <div className="grid gap-2">
            {folders.map((folder) => (
              <button
                key={folder.path}
                onClick={() => navigateToFolder(folder.path)}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
              >
                <Folder className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <span className="font-medium text-gray-900 dark:text-gray-100 flex-1">
                  {folder.name}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dateien */}
      {files.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dateien
          </h3>
          <div className="grid gap-2">
            {files.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
              >
                {getFileIcon(file.mimeType, file.name)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <a
                  href={`/api/projects/${projectId}/documents/download?path=${encodeURIComponent(file.path)}`}
                  download
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Herunterladen"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}