"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupForm } from "@/components/contacts/group-form";
import { toast } from "sonner";

interface ContactGroup {
  id: string;
  name: string;
  category: string;
  notes: string | null;
}

export default function EditContactGroupPage() {
  const params = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<ContactGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroup();
  }, [params.id]);

  async function fetchGroup() {
    try {
      const response = await fetch(`/api/contact-groups/${params.id}`);
      if (!response.ok) throw new Error("Gruppe nicht gefunden");
      const data = await response.json();
      setGroup(data);
    } catch (error) {
      toast.error("Fehler beim Laden der Gruppe");
      router.push("/contacts");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(data: any) {
    try {
      const response = await fetch(`/api/contact-groups/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Fehler beim Aktualisieren");

      toast.success("Gruppe erfolgreich aktualisiert");
      router.push(`/contacts/groups/${params.id}`);
    } catch (error) {
      toast.error("Fehler beim Aktualisieren der Gruppe");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Lade Gruppe...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Gruppe nicht gefunden
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/contacts/groups/${params.id}`}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gruppe bearbeiten
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <GroupForm
          group={group}
          onSubmit={handleUpdate}
          onCancel={() => router.push(`/contacts/groups/${params.id}`)}
        />
      </div>
    </div>
  );
}