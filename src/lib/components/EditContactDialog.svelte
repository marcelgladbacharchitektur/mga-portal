<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X } from 'phosphor-svelte';
  import type { Contact } from '$lib/types';
  
  export let open = false;
  export let contact: Contact | null = null;
  
  const dispatch = createEventDispatcher();
  
  let formData = {
    name: '',
    company: '',
    type: 'bauherr',
    email: '',
    phone: '',
    notes: ''
  };
  
  let loading = false;
  let error = '';
  
  $: if (contact && open) {
    formData = {
      name: contact.name,
      company: contact.company || '',
      type: contact.type || 'bauherr',
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || ''
    };
  }
  
  async function handleSubmit() {
    if (!contact) return;
    
    loading = true;
    error = '';
    
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update contact');
      }
      
      const updatedContact = await response.json();
      dispatch('updated', updatedContact);
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

{#if open && contact}
  <div class="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-ink/5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold">Kontakt bearbeiten</h2>
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
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 sm:col-span-1">
            <label for="edit-name" class="block text-sm font-medium text-ink mb-1">
              Name *
            </label>
            <input
              id="edit-name"
              type="text"
              bind:value={formData.name}
              required
              class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
            />
          </div>
          
          <div class="col-span-2 sm:col-span-1">
            <label for="edit-company" class="block text-sm font-medium text-ink mb-1">
              Firma
            </label>
            <input
              id="edit-company"
              type="text"
              bind:value={formData.company}
              class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
            />
          </div>
        </div>
        
        <div>
          <label for="edit-type" class="block text-sm font-medium text-ink mb-1">
            Typ
          </label>
          <select
            id="edit-type"
            bind:value={formData.type}
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
          >
            <option value="bauherr">Bauherr</option>
            <option value="planer">Planer</option>
            <option value="handwerker">Handwerker</option>
            <option value="behoerde">Behörde</option>
            <option value="sonstige">Sonstige</option>
          </select>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="edit-email" class="block text-sm font-medium text-ink mb-1">
              E-Mail
            </label>
            <input
              id="edit-email"
              type="email"
              bind:value={formData.email}
              class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
            />
          </div>
          
          <div>
            <label for="edit-phone" class="block text-sm font-medium text-ink mb-1">
              Telefon
            </label>
            <input
              id="edit-phone"
              type="tel"
              bind:value={formData.phone}
              class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
            />
          </div>
        </div>
        
        <div>
          <label for="edit-notes" class="block text-sm font-medium text-ink mb-1">
            Notizen
          </label>
          <textarea
            id="edit-notes"
            bind:value={formData.notes}
            rows="3"
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
          ></textarea>
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