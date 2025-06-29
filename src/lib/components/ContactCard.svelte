<script lang="ts">
  import type { Contact } from '$lib/types';
  import { Phone, Envelope, Buildings, NotePencil, PencilSimple, Trash } from 'phosphor-svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let contact: Contact;
  
  const dispatch = createEventDispatcher();
  
  function getTypeColor(type?: string) {
    switch (type) {
      case 'bauherr': return 'bg-blue-100 text-blue-800';
      case 'planer': return 'bg-purple-100 text-purple-800';
      case 'handwerker': return 'bg-orange-100 text-orange-800';
      case 'behoerde': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function getTypeLabel(type?: string) {
    switch (type) {
      case 'bauherr': return 'Bauherr';
      case 'planer': return 'Planer';
      case 'handwerker': return 'Handwerker';
      case 'behoerde': return 'Behörde';
      default: return 'Sonstige';
    }
  }
  
  async function handleDelete() {
    if (!confirm(`Möchten Sie ${contact.name} wirklich löschen?`)) return;
    
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete contact');
      
      dispatch('delete', contact.id);
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Fehler beim Löschen des Kontakts');
    }
  }
</script>

<div 
  class="card-hover p-6 cursor-pointer"
  on:click={() => dispatch('view', contact)}
>
  <div class="flex justify-between items-start mb-4">
    <div class="flex-1">
      <h3 class="text-lg font-semibold">{contact.name}</h3>
      {#if contact.company}
        <p class="text-sm text-ink/60 flex items-center gap-1 mt-1">
          <Buildings size={16} />
          {contact.company}
        </p>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      <span class={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(contact.type)}`}>
        {getTypeLabel(contact.type)}
      </span>
    </div>
  </div>
  
  <div class="space-y-2 text-sm">
    {#if contact.email}
      <a 
        href="mailto:{contact.email}"
        on:click|stopPropagation
        class="flex items-center gap-2 text-ink/70 hover:text-accent-green transition-colors"
      >
        <Envelope size={16} class="flex-shrink-0" />
        <span class="truncate">{contact.email}</span>
      </a>
    {/if}
    
    {#if contact.phone}
      <a 
        href="tel:{contact.phone}"
        on:click|stopPropagation
        class="flex items-center gap-2 text-ink/70 hover:text-accent-green transition-colors"
      >
        <Phone size={16} class="flex-shrink-0" />
        <span>{contact.phone}</span>
      </a>
    {/if}
    
    {#if contact.notes}
      <div class="flex items-start gap-2 text-ink/70">
        <NotePencil size={16} class="flex-shrink-0 mt-0.5" />
        <p class="text-xs line-clamp-2">{contact.notes}</p>
      </div>
    {/if}
  </div>
  
  <div class="flex justify-end gap-2 mt-4 pt-4 border-t border-ink/5">
    <button
      on:click|stopPropagation={() => dispatch('edit', contact)}
      class="p-2 rounded-lg hover:bg-ink/5 transition-colors"
      title="Bearbeiten"
    >
      <PencilSimple size={18} class="text-ink/60" />
    </button>
    <button
      on:click|stopPropagation={handleDelete}
      class="p-2 rounded-lg hover:bg-red-50 transition-colors"
      title="Löschen"
    >
      <Trash size={18} class="text-red-600" />
    </button>
  </div>
</div>