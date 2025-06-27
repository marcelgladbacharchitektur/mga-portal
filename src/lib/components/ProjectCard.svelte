<script lang="ts">
  import type { Project } from '$lib/types';
  
  export let project: Project;
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
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

<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <div class="flex justify-between items-start mb-4">
    <h3 class="text-lg font-semibold">{project.name}</h3>
    <span class="text-sm font-mono text-gray-500">{project.project_id}</span>
  </div>
  
  <div class="space-y-2 text-sm text-gray-600">
    {#if project.cadastral_community}
      <div class="flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        {project.cadastral_community}
      </div>
    {/if}
    
    {#if project.plot_area}
      <div class="flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
        </svg>
        {project.plot_area} m²
      </div>
    {/if}
    
    {#if project.budget_hours}
      <div class="flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {project.budget_hours} Stunden
      </div>
    {/if}
  </div>
  
  <div class="mt-4 flex items-center justify-between">
    <span class={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
      {getStatusLabel(project.status)}
    </span>
    
    <div class="flex space-x-2">
      {#if project.drive_folder_url}
        <a
          href={project.drive_folder_url}
          target="_blank"
          rel="noopener noreferrer"
          class="text-gray-600 hover:text-gray-900"
          title="Google Drive Ordner"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.71 3.52L1.15 15l3.43 6h11.55l3.43-6M9.73 3h8.54L24 12.5 20.57 18M3.41 15L9.7 3l4.3 7.5z"/>
          </svg>
        </a>
      {/if}
      
      {#if project.calendar_id}
        <button
          class="text-gray-600 hover:text-gray-900"
          title="Google Calendar"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </button>
      {/if}
      
      {#if project.tasks_list_id}
        <button
          class="text-gray-600 hover:text-gray-900"
          title="Google Tasks"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
          </svg>
        </button>
      {/if}
    </div>
  </div>
</div>