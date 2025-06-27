import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/projects/project-form";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  
  const project = await prisma.project.findUnique({
    where: { id }
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zu Projektdetails
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Projekt bearbeiten
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            #{project.projectNumber} - {project.name}
          </p>

          <ProjectForm 
            mode="edit" 
            project={{
              id: project.id,
              name: project.name,
              budget: project.budget,
              status: project.status,
              projectType: project.projectType,
              projectSector: project.projectSector,
              parcelNumber: project.parcelNumber,
              plotAddress: project.plotAddress,
              plotArea: project.plotArea,
              cadastralCommunity: project.cadastralCommunity,
              registrationNumber: project.registrationNumber,
              zoning: project.zoning,
              plotNotes: project.plotNotes
            }}
          />
        </div>
      </div>
    </div>
  );
}