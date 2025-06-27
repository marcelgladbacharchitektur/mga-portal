<script lang="ts">
  import { onMount } from 'svelte';
  import type { Project } from '$lib/types';
  import CreateProjectDialog from '$lib/components/CreateProjectDialog.svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  
  let projects: Project[] = [];
  let loading = true;
  let error = '';
  let showCreateDialog = false;

  async function loadProjects() {
    loading = true;
    error = '';
    try {
      const response = await fetch('/api/projects-supabase');
      if (!response.ok) throw new Error('Failed to fetch projects');
      projects = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadProjects();
  });
  
  function handleProjectCreated(event: CustomEvent<Project>) {
    projects = [event.detail, ...projects];
    showCreateDialog = false;
  }
</script>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Projekte</h1>
    <button
      on:click={() => showCreateDialog = true}
      class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
      <span>Neues Projekt</span>
    </button>
  </div>
  
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      Fehler: {error}
    </div>
  {:else if projects.length === 0}
    <div class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Keine Projekte</h3>
      <p class="mt-1 text-sm text-gray-500">Erstellen Sie Ihr erstes Projekt.</p>
      <div class="mt-6">
        <button
          on:click={() => showCreateDialog = true}
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Projekt erstellen
        </button>
      </div>
    </div>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each projects as project}
        <ProjectCard {project} />
      {/each}
    </div>
  {/if}
</div>

<CreateProjectDialog bind:open={showCreateDialog} on:created={handleProjectCreated} />