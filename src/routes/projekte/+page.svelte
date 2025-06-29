<script lang="ts">
  import { onMount } from 'svelte';
  import type { Project } from '$lib/types';
  import CreateProjectDialog from '$lib/components/CreateProjectDialog.svelte';
  import EditProjectDialog from '$lib/components/EditProjectDialog.svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import { Plus, Folder, MagnifyingGlass, List, GridFour, MapPin, Ruler, Clock, FolderOpen, PencilSimple } from 'phosphor-svelte';
  import { page } from '$app/stores';
  
  let projects: Project[] = [];
  let filteredProjects: Project[] = [];
  let loading = true;
  let error = '';
  let showCreateDialog = false;
  let showEditDialog = false;
  let editingProject: Project | null = null;
  let googleAuthStatus = 'checking'; // 'checking', 'authenticated', 'not_authenticated'
  let searchQuery = '';
  let viewMode: 'grid' | 'list' = 'grid';
  let statusFilter = 'all';

  async function loadProjects() {
    loading = true;
    error = '';
    try {
      const response = await fetch('/api/projects-supabase');
      if (!response.ok) throw new Error('Failed to fetch projects');
      projects = await response.json();
      filterProjects();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    loadProjects();
    
    // Check Google auth status
    try {
      const response = await fetch('/api/auth/google/status');
      const data = await response.json();
      googleAuthStatus = data.authenticated ? 'authenticated' : 'not_authenticated';
    } catch (error) {
      googleAuthStatus = 'not_authenticated';
    }
    
    // Check if we should open create dialog
    if ($page.url.searchParams.get('action') === 'new') {
      showCreateDialog = true;
    }
  });
  
  function handleProjectCreated(event: CustomEvent<Project>) {
    projects = [event.detail, ...projects];
    filterProjects();
    showCreateDialog = false;
  }
  
  function handleEditProject(project: Project) {
    editingProject = project;
    showEditDialog = true;
  }
  
  function handleProjectUpdated(event: CustomEvent<Project>) {
    const updatedProject = event.detail;
    projects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    filterProjects();
    showEditDialog = false;
  }
  
  function filterProjects() {
    filteredProjects = projects.filter(project => {
      const matchesSearch = searchQuery === '' || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.project_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.cadastral_community?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE': return 'bg-accent-green/20 text-accent-green';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'ARCHIVED': return 'bg-ink/10 text-ink/60';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function getStatusLabel(status: string) {
    switch (status) {
      case 'ACTIVE': return 'Aktiv';
      case 'ON_HOLD': return 'Pausiert';
      case 'COMPLETED': return 'Abgeschlossen';
      case 'ARCHIVED': return 'Archiviert';
      default: return status;
    }
  }
  
  $: searchQuery, statusFilter, filterProjects();
</script>

<div class="container mx-auto p-4">
  {#if googleAuthStatus === 'not_authenticated'}
    <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6 flex items-center justify-between">
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <span>Google Drive Integration nicht verbunden</span>
      </div>
      <a
        href="/api/auth/google?action=login"
        class="px-3 py-1 bg-accent-green text-white rounded text-sm hover:bg-accent-green/90 transition-colors"
      >
        Mit Google verbinden
      </a>
    </div>
  {/if}
  
  <div class="mb-6">
    <h1 class="text-3xl font-bold mb-4">Projekte</h1>
    
    <!-- Controls -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- Search -->
      <div class="relative flex-1 max-w-md">
        <MagnifyingGlass size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="Suche nach Name, ID, Kunde oder Ort..."
          class="w-full pl-10 pr-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
        />
      </div>
      
      <!-- Status Filter -->
      <select
        bind:value={statusFilter}
        class="px-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green"
      >
        <option value="all">Alle Status</option>
        <option value="ACTIVE">Aktiv</option>
        <option value="ON_HOLD">Pausiert</option>
        <option value="COMPLETED">Abgeschlossen</option>
        <option value="ARCHIVED">Archiviert</option>
      </select>
      
      <!-- View Mode Toggle -->
      <div class="flex gap-1 bg-ink/5 rounded-lg p-1">
        <button
          on:click={() => viewMode = 'grid'}
          class="p-2 rounded {viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-ink/5'} transition-all"
          title="Kartenansicht"
        >
          <GridFour size={20} class="{viewMode === 'grid' ? 'text-accent-green' : 'text-ink/60'}" />
        </button>
        <button
          on:click={() => viewMode = 'list'}
          class="p-2 rounded {viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-ink/5'} transition-all"
          title="Listenansicht"
        >
          <List size={20} class="{viewMode === 'list' ? 'text-accent-green' : 'text-ink/60'}" />
        </button>
      </div>
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
  {:else if filteredProjects.length === 0}
    <div class="bg-ink/5 rounded-lg p-8 text-center">
      <FolderOpen size={48} class="mx-auto text-ink/30 mb-4" />
      <h3 class="text-lg font-medium text-ink mb-2">
        {searchQuery || statusFilter !== 'all' ? 'Keine Projekte gefunden' : 'Noch keine Projekte vorhanden'}
      </h3>
      <p class="text-ink/60 mb-4">
        {searchQuery || statusFilter !== 'all' ? 'Versuchen Sie eine andere Suche.' : 'Erstellen Sie Ihr erstes Projekt.'}
      </p>
      {#if !searchQuery && statusFilter === 'all'}
        <button
          on:click={() => showCreateDialog = true}
          class="inline-flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors"
        >
          <Plus size={20} />
          Erstes Projekt anlegen
        </button>
      {/if}
    </div>
  {:else if viewMode === 'grid'}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each filteredProjects as project}
        <ProjectCard {project} on:edit={(e) => handleEditProject(e.detail)} />
      {/each}
    </div>
  {:else}
    <!-- List View -->
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 overflow-hidden">
      <table class="w-full">
        <thead class="bg-ink/5 text-sm">
          <tr>
            <th class="text-left px-4 py-3">Projekt</th>
            <th class="text-left px-4 py-3 hidden md:table-cell">Kunde</th>
            <th class="text-left px-4 py-3 hidden lg:table-cell">Ort</th>
            <th class="text-left px-4 py-3 hidden lg:table-cell">Fläche</th>
            <th class="text-center px-4 py-3">Status</th>
            <th class="text-right px-4 py-3">Aktionen</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink/10">
          {#each filteredProjects as project}
            <tr class="hover:bg-ink/5 transition-colors">
              <td class="px-4 py-3">
                <div>
                  <a href="/projekte/{project.id}" class="font-medium text-ink hover:text-accent-green">
                    {project.name}
                  </a>
                  <p class="text-sm text-ink/60 font-mono">{project.project_id}</p>
                </div>
              </td>
              <td class="px-4 py-3 text-sm hidden md:table-cell">
                {project.client || '-'}
              </td>
              <td class="px-4 py-3 text-sm hidden lg:table-cell">
                {project.cadastral_community || '-'}
              </td>
              <td class="px-4 py-3 text-sm hidden lg:table-cell">
                {project.plot_area ? `${project.plot_area} m²` : '-'}
              </td>
              <td class="px-4 py-3 text-center">
                <span class="px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(project.status)}">
                  {getStatusLabel(project.status)}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  {#if project.drive_folder_url}
                    <a
                      href={project.drive_folder_url}
                      target="_blank"
                      class="p-1 text-ink/60 hover:text-accent-green transition-colors"
                      title="Google Drive"
                    >
                      <FolderOpen size={18} />
                    </a>
                  {/if}
                  <a
                    href="/zeiterfassung?project={project.id}"
                    class="p-1 text-ink/60 hover:text-accent-green transition-colors"
                    title="Zeit erfassen"
                  >
                    <Clock size={18} />
                  </a>
                  <button
                    on:click={() => handleEditProject(project)}
                    class="p-1 text-ink/60 hover:text-accent-green transition-colors"
                    title="Bearbeiten"
                  >
                    <PencilSimple size={18} />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<CreateProjectDialog bind:open={showCreateDialog} on:created={handleProjectCreated} />
<EditProjectDialog bind:open={showEditDialog} bind:project={editingProject} on:updated={handleProjectUpdated} />