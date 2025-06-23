import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function ProjectNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Projekt nicht gefunden
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Das angeforderte Projekt existiert nicht oder wurde gelöscht.
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Projektliste
        </Link>
      </div>
    </div>
  );
}