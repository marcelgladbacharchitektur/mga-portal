<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import type { Project } from '$lib/types';
  import ProjectContacts from '$lib/components/ProjectContacts.svelte';
  import { GoogleDriveLogo, Calendar, ListChecks, Clock, Folder, ArrowLeft } from 'phosphor-svelte';
  
  let project: Project | null = null;
  let loading = true;
  let error = '';
  
  $: projectId = $page.params.id;
  
  async function loadProject() {
    loading = true;
    error = '';
    
    try {
      const response = await fetch(`/api/projects-supabase/${projectId}`);
      if (!response.ok) throw new Error('Failed to load project');
      project = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
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
  
  onMount(() => {
    loadProject();
  });
</script>

<div class="container mx-auto p-4">
  <!-- Back button -->
  <a href="/projekte" class="inline-flex items-center gap-2 text-ink/60 hover:text-accent-green mb-6">
    <ArrowLeft size={20} />
    <span>Zurück zu Projekten</span>
  </a>
  
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
    </div>
  {:else if error}
    <div class="bg-red-100/50 border border-red-400/50 text-red-700 px-4 py-3 rounded">
      Fehler: {error}
    </div>
  {:else if project}
    <div class="mb-8">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold">{project.name}</h1>
          <p class="text-lg text-ink/60 font-mono">{project.project_id}</p>
        </div>
        <span class={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
          {getStatusLabel(project.status)}
        </span>
      </div>
      
      <!-- Project Details -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {#if project.cadastral_community}
          <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
            <p class="text-sm text-ink/60 mb-1">Katastralgemeinde</p>
            <p class="font-medium">{project.cadastral_community}</p>
          </div>
        {/if}
        
        {#if project.plot_area}
          <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
            <p class="text-sm text-ink/60 mb-1">Grundstücksfläche</p>
            <p class="font-medium">{project.plot_area} m²</p>
          </div>
        {/if}
        
        {#if project.budget_hours}
          <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
            <p class="text-sm text-ink/60 mb-1">Budget</p>
            <p class="font-medium">{project.budget_hours} Stunden</p>
          </div>
        {/if}
        
        <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
          <p class="text-sm text-ink/60 mb-1">Erstellt am</p>
          <p class="font-medium">
            {new Date(project.created_at || '').toLocaleDateString('de-AT')}
          </p>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {#if project.drive_folder_url}
          <a
            href={project.drive_folder_url}
            target="_blank"
            class="flex items-center justify-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-ink/10 hover:shadow-md transition-shadow"
          >
            <GoogleDriveLogo size={24} weight="fill" class="text-ink/60" />
            <span>Google Drive</span>
          </a>
          
          <a
            href="/projekte/{project.id}/drive"
            class="flex items-center justify-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-ink/10 hover:shadow-md transition-shadow"
          >
            <Folder size={24} class="text-ink/60" />
            <span>Dateien</span>
          </a>
        {/if}
        
        {#if project.calendar_id}
          <button
            class="flex items-center justify-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-ink/10 hover:shadow-md transition-shadow"
          >
            <Calendar size={24} class="text-ink/60" />
            <span>Kalender</span>
          </button>
        {/if}
        
        {#if project.tasks_list_id}
          <button
            class="flex items-center justify-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-ink/10 hover:shadow-md transition-shadow"
          >
            <ListChecks size={24} class="text-ink/60" />
            <span>Aufgaben</span>
          </button>
        {/if}
        
        <a
          href="/zeiterfassung?project={project.id}"
          class="flex items-center justify-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-ink/10 hover:shadow-md transition-shadow"
        >
          <Clock size={24} class="text-ink/60" />
          <span>Zeit erfassen</span>
        </a>
      </div>
      
      <!-- Project Contacts -->
      <ProjectContacts projectId={project.id} />
    </div>
  {/if}
</div>