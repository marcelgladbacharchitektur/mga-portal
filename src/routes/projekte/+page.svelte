<script lang="ts">
  import { onMount } from 'svelte';
  
  interface Project {
    projektId: string;
    projektname: string;
    status: string;
    kundenKontaktId: string;
    katastralgemeinde: string;
    grundstuecksflaeche: string;
    budgetStunden: string;
    driveOrdnerUrl: string;
    photosAlbumUrl: string;
    tasksListenId: string;
    calendarId: string;
  }

  let projects: Project[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      projects = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  });
</script>

<div class="container mx-auto p-4">
  <h1 class="text-3xl font-bold mb-6">Projekte</h1>
  
  {#if loading}
    <p class="text-gray-500">Lade Projekte...</p>
  {:else if error}
    <p class="text-red-500">Fehler: {error}</p>
  {:else if projects.length === 0}
    <p class="text-gray-500">Keine Projekte gefunden.</p>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each projects as project}
        <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow">
          <h2 class="font-semibold text-lg">{project.projektname}</h2>
          <p class="text-sm text-gray-600">ID: {project.projektId}</p>
          <p class="text-sm">Status: <span class="font-medium">{project.status}</span></p>
          {#if project.katastralgemeinde}
            <p class="text-sm">KG: {project.katastralgemeinde}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>