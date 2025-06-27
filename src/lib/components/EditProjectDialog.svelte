<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X } from 'phosphor-svelte';
  import type { Project } from '$lib/types';
  
  export let open = false;
  export let project: Project | null = null;
  
  const dispatch = createEventDispatcher();
  
  let formData = {
    name: '',
    cadastral_community: '',
    plot_area: '',
    budget_hours: '',
    status: 'ACTIVE'
  };
  
  let loading = false;
  let error = '';
  
  $: if (project && open) {
    formData = {
      name: project.name,
      cadastral_community: project.cadastral_community || '',
      plot_area: project.plot_area?.toString() || '',
      budget_hours: project.budget_hours?.toString() || '',
      status: project.status
    };
  }
  
  async function handleSubmit() {
    if (!project) return;
    
    loading = true;
    error = '';
    
    try {
      const response = await fetch(`/api/projects-supabase/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project');
      }
      
      const updatedProject = await response.json();
      dispatch('updated', updatedProject);
      open = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
  
  function handleClose() {
    open = false;
  }
</script>

{#if open && project}
  <div class="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-ink/5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold">Projekt bearbeiten</h2>
        <button
          on:click={handleClose}
          class="p-2 rounded-lg hover:bg-ink/5 transition-colors"
        >
          <X size={20} class="text-ink/60" />
        </button>
      </div>
      
      {#if error}
        <div class="bg-red-100/50 border border-red-400/50 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      {/if}
      
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
          <label for="edit-name" class="block text-sm font-medium text-ink mb-1">
            Projektname *
          </label>
          <input
            id="edit-name"
            type="text"
            bind:value={formData.name}
            required
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
          />
        </div>
        
        <div>
          <label for="edit-cadastral" class="block text-sm font-medium text-ink mb-1">
            Katastralgemeinde
          </label>
          <input
            id="edit-cadastral"
            type="text"
            bind:value={formData.cadastral_community}
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
          />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="edit-plot" class="block text-sm font-medium text-ink mb-1">
              Grundstücksfläche (m²)
            </label>
            <input
              id="edit-plot"
              type="number"
              step="0.01"
              bind:value={formData.plot_area}
              class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
            />
          </div>
          
          <div>
            <label for="edit-hours" class="block text-sm font-medium text-ink mb-1">
              Budget (Stunden)
            </label>
            <input
              id="edit-hours"
              type="number"
              bind:value={formData.budget_hours}
              class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
            />
          </div>
        </div>
        
        <div>
          <label for="edit-status" class="block text-sm font-medium text-ink mb-1">
            Status
          </label>
          <select
            id="edit-status"
            bind:value={formData.status}
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
          >
            <option value="ACTIVE">Aktiv</option>
            <option value="ON_HOLD">Pausiert</option>
            <option value="COMPLETED">Abgeschlossen</option>
            <option value="ARCHIVED">Archiviert</option>
          </select>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            on:click={handleClose}
            class="px-4 py-2 text-ink bg-ink/10 rounded-md hover:bg-ink/20 transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name}
            class="px-4 py-2 bg-accent-green text-white rounded-md hover:bg-accent-green/90 transition-colors disabled:bg-ink/30"
          >
            {loading ? 'Speichere...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}