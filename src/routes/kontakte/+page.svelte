<script lang="ts">
  import { onMount } from 'svelte';
  import type { Contact } from '$lib/types';
  import { Plus, MagnifyingGlass, Phone, Envelope, Buildings, User } from 'phosphor-svelte';
  import { page } from '$app/stores';
  import CreateContactDialog from '$lib/components/CreateContactDialog.svelte';
  import EditContactDialog from '$lib/components/EditContactDialog.svelte';
  import ContactCard from '$lib/components/ContactCard.svelte';
  
  let contacts: Contact[] = [];
  let filteredContacts: Contact[] = [];
  let loading = true;
  let error = '';
  let searchQuery = '';
  let selectedType = 'all';
  let showCreateDialog = false;
  let showEditDialog = false;
  let editingContact: Contact | null = null;
  
  const contactTypes = [
    { value: 'all', label: 'Alle' },
    { value: 'bauherr', label: 'Bauherr' },
    { value: 'planer', label: 'Planer' },
    { value: 'handwerker', label: 'Handwerker' },
    { value: 'behoerde', label: 'Behörde' },
    { value: 'sonstige', label: 'Sonstige' }
  ];
  
  async function loadContacts() {
    loading = true;
    error = '';
    try {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      contacts = await response.json();
      filterContacts();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
  
  function filterContacts() {
    filteredContacts = contacts.filter(contact => {
      const matchesSearch = searchQuery === '' || 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === 'all' || contact.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }
  
  $: searchQuery, selectedType, filterContacts();
  
  onMount(() => {
    loadContacts();
    
    // Check if we should open create dialog
    if ($page.url.searchParams.get('action') === 'new') {
      showCreateDialog = true;
    }
  });
  
  function handleContactCreated(event: CustomEvent<Contact>) {
    contacts = [event.detail, ...contacts];
    filterContacts();
    showCreateDialog = false;
  }
  
  function handleEditContact(contact: Contact) {
    editingContact = contact;
    showEditDialog = true;
  }
  
  function handleContactUpdated(event: CustomEvent<Contact>) {
    const updatedContact = event.detail;
    contacts = contacts.map(c => c.id === updatedContact.id ? updatedContact : c);
    filterContacts();
    showEditDialog = false;
  }
  
  function handleContactDeleted(event: CustomEvent<string>) {
    contacts = contacts.filter(c => c.id !== event.detail);
    filterContacts();
  }
</script>

<div class="container mx-auto p-4">
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
    <h1 class="text-3xl font-bold">Kontakte</h1>
    
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Search -->
      <div class="relative">
        <MagnifyingGlass size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="Suchen..."
          class="pl-10 pr-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
        />
      </div>
      
      <!-- Type Filter -->
      <select
        bind:value={selectedType}
        class="px-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
      >
        {#each contactTypes as type}
          <option value={type.value}>{type.label}</option>
        {/each}
      </select>
    </div>
  </div>
  
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
    </div>
  {:else if error}
    <div class="bg-red-100/50 border border-red-400/50 text-red-700 px-4 py-3 rounded">
      Fehler: {error}
    </div>
  {:else if filteredContacts.length === 0}
    <div class="text-center py-12">
      <User size={48} class="mx-auto text-ink/30 mb-4" />
      <h3 class="text-sm font-medium text-ink">
        {searchQuery || selectedType !== 'all' ? 'Keine Kontakte gefunden' : 'Keine Kontakte'}
      </h3>
      <p class="mt-1 text-sm text-ink/60">
        {searchQuery || selectedType !== 'all' ? 'Versuchen Sie eine andere Suche.' : 'Nutzen Sie den + Button um Ihren ersten Kontakt zu erstellen.'}
      </p>
    </div>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each filteredContacts as contact}
        <ContactCard 
          {contact} 
          on:edit={(e) => handleEditContact(e.detail)}
          on:delete={handleContactDeleted}
          on:view={(e) => handleEditContact(e.detail)}
        />
      {/each}
    </div>
  {/if}
</div>

<CreateContactDialog bind:open={showCreateDialog} on:created={handleContactCreated} />
<EditContactDialog bind:open={showEditDialog} bind:contact={editingContact} on:updated={handleContactUpdated} />