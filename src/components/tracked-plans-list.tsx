"use client";

import { useState, useEffect } from "react";
import { FileSpreadsheet, Plus, ChevronRight, Clock, FileUp, Share2 } from "lucide-react";
import { CreateTrackedPlanDialog } from "./create-tracked-plan-dialog";
import { PlanVersionsList } from "./plan-versions-list";
import { SharePlanDialog } from "./share-plan-dialog";

interface TrackedPlan {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  PlanVersion: Array<{
    id: string;
    versionNumber: number;
    uploadedAt: string;
  }>;
}

interface TrackedPlansListProps {
  projectId: string;
}

export function TrackedPlansList({ projectId }: TrackedPlansListProps) {
  const [plans, setPlans] = useState<TrackedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [shareDialogPlan, setShareDialogPlan] = useState<{ id: string; title: string } | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, [projectId]);

  async function fetchPlans() {
    try {
      const response = await fetch(`/api/projects/${projectId}/plans`);
      if (!response.ok) throw new Error('Pläne konnten nicht geladen werden');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Fehler beim Laden der Pläne:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePlan(title: string, description?: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) throw new Error('Plan konnte nicht erstellt werden');
      
      await fetchPlans();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Fehler beim Erstellen des Plans:', error);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Create Button */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Nachverfolgte Pläne
          </h2>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nachverfolgten Plan anlegen
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-8">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Noch keine Pläne angelegt. Erstellen Sie den ersten nachverfolgten Plan für dieses Projekt.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div key={plan.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <button
                    onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                    className="flex-1 px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight 
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          expandedPlan === plan.id ? 'rotate-90' : ''
                        }`} 
                      />
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {plan.title}
                        </h3>
                        {plan.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {plan.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileUp className="w-4 h-4" />
                        {plan.PlanVersion.length} Version{plan.PlanVersion.length !== 1 ? 'en' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(plan.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </button>
                  {plan.PlanVersion.length > 0 && (
                    <button
                      onClick={() => setShareDialogPlan({ id: plan.id, title: plan.title })}
                      className="px-3 py-3 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l border-gray-200 dark:border-gray-700 transition-colors"
                      title="Plan teilen"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {expandedPlan === plan.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <PlanVersionsList 
                      trackedPlanId={plan.id} 
                      projectId={projectId}
                      onVersionsChange={fetchPlans}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateTrackedPlanDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreatePlan}
      />

      {/* Share Dialog */}
      {shareDialogPlan && (
        <SharePlanDialog
          isOpen={true}
          onClose={() => setShareDialogPlan(null)}
          trackedPlanId={shareDialogPlan.id}
          planTitle={shareDialogPlan.title}
        />
      )}
    </div>
  );
}