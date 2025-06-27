<script lang="ts">
  import { onMount } from 'svelte';
  import type { Contact } from '$lib/types';
  import { UserPlus, X, Phone, Envelope } from 'phosphor-svelte';
  
  export let projectId: string;
  
  interface ProjectContact extends Contact {
    role?: string;
  }
  
  let projectContacts: ProjectContact[] = [];
  let allContacts: Contact[] = [];
  let loading = true;
  let showAddDialog = false;
  let selectedContactId = '';
  let selectedRole = '';
  
  const roles = [
    { value: 'bauherr', label: 'Bauherr' },
    { value: 'architekt', label: 'Architekt' },
    { value: 'statiker', label: 'Statiker' },
    { value: 'elektriker', label: 'Elektriker' },
    { value: 'installateur', label: 'Installateur' },
    { value: 'sonstige', label: 'Sonstige' }
  ];
  
  async function loadProjectContacts() {
    try {
      const response = await fetch(`/api/projects/${projectId}/contacts`);
      if (!response.ok) throw new Error('Failed to load contacts');
      projectContacts = await response.json();
    } catch (error) {
      console.error('Error loading project contacts:', error);
    }
  }
  
  async function loadAllContacts() {
    try {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to load contacts');
      const contacts = await response.json();
      
      // Filter out already assigned contacts
      const assignedIds = projectContacts.map(pc => pc.id);
      allContacts = contacts.filter((c: Contact) => !assignedIds.includes(c.id));
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }
  
  async function addContact() {
    if (!selectedContactId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selectedContactId,
          role: selectedRole || null
        })
      });
      
      if (!response.ok) throw new Error('Failed to add contact');
      
      await loadProjectContacts();
      await loadAllContacts();
      showAddDialog = false;
      selectedContactId = '';
      selectedRole = '';
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  }
  
  async function removeContact(contactId: string) {
    if (!confirm('Kontakt wirklich entfernen?')) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/contacts/${contactId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to remove contact');
      
      await loadProjectContacts();
      await loadAllContacts();
    } catch (error) {
      console.error('Error removing contact:', error);
    }
  }
  
  onMount(async () => {
    loading = true;
    await loadProjectContacts();
    await loadAllContacts();
    loading = false;
  });
</script>

<div class="bg-white rounded-lg shadow-md p-6 border border-ink/5">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold">Projektbeteiligte</h3>
    <button
      on:click={() => showAddDialog = true}
      class="p-2 rounded-lg bg-accent-green text-white hover:bg-accent-green/90 transition-colors"
      title="Kontakt hinzufügen"
    >
      <UserPlus size={20} />
    </button>
  </div>
  
  {#if loading}
    <div class="animate-pulse space-y-2">
      <div class="h-12 bg-ink/10 rounded"></div>
      <div class="h-12 bg-ink/10 rounded"></div>
    </div>
  {:else if projectContacts.length === 0}
    <p class="text-sm text-ink/60 text-center py-4">
      Noch keine Kontakte zugeordnet
    </p>
  {:else}
    <div class="space-y-2">
      {#each projectContacts as contact}
        <div class="flex items-center justify-between p-3 rounded-lg bg-paper hover:bg-ink/5 transition-colors">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium">{contact.name}</span>
              {#if contact.role}
                <span class="text-xs px-2 py-0.5 rounded-full bg-accent-green/20 text-accent-green">
                  {roles.find(r => r.value === contact.role)?.label || contact.role}
                </span>
              {/if}
            </div>
            {#if contact.company}
              <p class="text-sm text-ink/60">{contact.company}</p>
            {/if}
            <div class="flex gap-4 mt-1">
              {#if contact.email}
                <a 
                  href="mailto:{contact.email}"
                  class="text-xs text-ink/60 hover:text-accent-green flex items-center gap-1"
                >
                  <Envelope size={14} />
                  {contact.email}
                </a>
              {/if}
              {#if contact.phone}
                <a 
                  href="tel:{contact.phone}"
                  class="text-xs text-ink/60 hover:text-accent-green flex items-center gap-1"
                >
                  <Phone size={14} />
                  {contact.phone}
                </a>
              {/if}
            </div>
          </div>
          <button
            on:click={() => removeContact(contact.id)}
            class="p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Entfernen"
          >
            <X size={18} class="text-red-600" />
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Add Contact Dialog -->
{#if showAddDialog}
  <div class="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-ink/5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Kontakt hinzufügen</h3>
        <button
          on:click={() => showAddDialog = false}
          class="p-2 rounded-lg hover:bg-ink/5 transition-colors"
        >
          <X size={20} class="text-ink/60" />
        </button>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-ink mb-1">
            Kontakt auswählen
          </label>
          <select
            bind:value={selectedContactId}
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50"
          >
            <option value="">Bitte wählen...</option>
            {#each allContacts as contact}
              <option value={contact.id}>
                {contact.name} {contact.company ? `(${contact.company})` : ''}
              </option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-ink mb-1">
            Rolle im Projekt
          </label>
          <select
            bind:value={selectedRole}
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50"
          >
            <option value="">Keine spezifische Rolle</option>
            {#each roles as role}
              <option value={role.value}>{role.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="flex justify-end gap-3 pt-4">
          <button
            on:click={() => showAddDialog = false}
            class="px-4 py-2 text-ink bg-ink/10 rounded-md hover:bg-ink/20 transition-colors"
          >
            Abbrechen
          </button>
          <button
            on:click={addContact}
            disabled={!selectedContactId}
            class="px-4 py-2 bg-accent-green text-white rounded-md hover:bg-accent-green/90 transition-colors disabled:bg-ink/30"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}