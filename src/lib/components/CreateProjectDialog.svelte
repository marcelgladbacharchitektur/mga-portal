<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let open = false;
  
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
  
  async function handleSubmit() {
    loading = true;
    error = '';
    
    try {
      const response = await fetch('/api/projects-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create project');
      }
      
      const project = await response.json();
      dispatch('created', project);
      
      // Reset form
      formData = {
        name: '',
        cadastral_community: '',
        plot_area: '',
        budget_hours: '',
        status: 'ACTIVE'
      };
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

{#if open}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h2 class="text-2xl font-bold mb-4">Neues Projekt erstellen</h2>
      
      {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      {/if}
      
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            Projektname *
          </label>
          <input
            id="name"
            type="text"
            bind:value={formData.name}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Einfamilienhaus Müller"
          />
        </div>
        
        <div>
          <label for="cadastral_community" class="block text-sm font-medium text-gray-700 mb-1">
            Katastralgemeinde
          </label>
          <input
            id="cadastral_community"
            type="text"
            bind:value={formData.cadastral_community}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Innsbruck"
          />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="plot_area" class="block text-sm font-medium text-gray-700 mb-1">
              Grundstücksfläche (m²)
            </label>
            <input
              id="plot_area"
              type="number"
              step="0.01"
              bind:value={formData.plot_area}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. 850"
            />
          </div>
          
          <div>
            <label for="budget_hours" class="block text-sm font-medium text-gray-700 mb-1">
              Budget (Stunden)
            </label>
            <input
              id="budget_hours"
              type="number"
              bind:value={formData.budget_hours}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. 120"
            />
          </div>
        </div>
        
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            bind:value={formData.status}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name}
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Erstelle...' : 'Projekt erstellen'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}