<script lang="ts">
  import type { Project } from '$lib/types';
  import { MapPin, Ruler, Clock, GoogleDriveLogo, Calendar, ListChecks, PencilSimple, Folder, Users } from 'phosphor-svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let project: Project;
  
  const dispatch = createEventDispatcher();
  
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
</script>

<a href="/projekte/{project.id}" class="block card-hover p-6 group">
  <div class="flex justify-between items-start mb-4">
    <div>
      <h3 class="text-lg font-semibold">{project.name}</h3>
      <span class="text-sm font-mono text-ink/60">{project.project_id}</span>
    </div>
    <button
      on:click|preventDefault|stopPropagation={() => dispatch('edit', project)}
      class="p-2 rounded-lg hover:bg-ink/5 transition-colors relative z-10"
      title="Projekt bearbeiten"
    >
      <PencilSimple size={20} class="text-ink/60" />
    </button>
  </div>
  
  <div class="space-y-2 text-sm text-ink/70">
    {#if project.cadastral_community}
      <div class="flex items-center">
        <MapPin size={16} class="mr-2 flex-shrink-0" />
        {project.cadastral_community}
      </div>
    {/if}
    
    {#if project.plot_area}
      <div class="flex items-center">
        <Ruler size={16} class="mr-2 flex-shrink-0" />
        {project.plot_area} m²
      </div>
    {/if}
    
    {#if project.budget_hours}
      <div class="flex items-center">
        <Clock size={16} class="mr-2 flex-shrink-0" />
        {project.budget_hours} Stunden
      </div>
    {/if}
  </div>
  
  <!-- Quick Links -->
  <div class="mt-3 mb-3 flex flex-wrap gap-2">
    <!-- Drive Browser (zeige immer an) -->
    <span
      on:click|preventDefault|stopPropagation={() => window.location.href = `/projekte/${project.id}/drive`}
      class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-ink/5 hover:bg-ink/10 rounded-full transition-colors cursor-pointer relative z-10"
    >
      <Folder size={14} />
      Browser
    </span>
    
    <!-- Direkter Google Drive Link -->
    {#if project.drive_folder_id || project.drive_folder_url}
      <span
        on:click|preventDefault|stopPropagation={() => {
          let driveUrl = '';
          if (project.drive_folder_id) {
            driveUrl = `https://drive.google.com/drive/folders/${project.drive_folder_id}`;
          } else if (project.drive_folder_url) {
            driveUrl = project.drive_folder_url;
          }
          if (driveUrl) window.open(driveUrl, '_blank');
        }}
        class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-ink/5 hover:bg-ink/10 rounded-full transition-colors cursor-pointer relative z-10"
      >
        <GoogleDriveLogo size={14} />
        Drive
      </span>
    {/if}
    
    <span
      on:click|preventDefault|stopPropagation={() => window.location.href = `/zeiterfassung?project=${project.id}`}
      class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-ink/5 hover:bg-ink/10 rounded-full transition-colors cursor-pointer relative z-10"
    >
      <Clock size={14} />
      Zeit erfassen
    </span>
  </div>
  
  <div class="flex items-center justify-between">
    <span class={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
      {getStatusLabel(project.status)}
    </span>
    
    <div class="flex space-x-2">
      {#if project.drive_folder_url}
        <button
          on:click|preventDefault|stopPropagation={() => window.open(project.drive_folder_url, '_blank')}
          class="text-ink/60 hover:text-accent-green transition-colors relative z-10"
          title="Google Drive Ordner"
          aria-label="Google Drive Ordner öffnen"
        >
          <GoogleDriveLogo size={20} weight="fill" />
        </button>
      {/if}
      
      {#if project.calendar_id}
        <button
          class="text-ink/60 hover:text-accent-green transition-colors"
          title="Google Calendar"
          aria-label="Google Calendar öffnen"
        >
          <Calendar size={20} />
        </button>
      {/if}
      
      {#if project.tasks_list_id}
        <button
          class="text-ink/60 hover:text-accent-green transition-colors"
          title="Google Tasks"
          aria-label="Google Tasks öffnen"
        >
          <ListChecks size={20} />
        </button>
      {/if}
    </div>
  </div>
</a>