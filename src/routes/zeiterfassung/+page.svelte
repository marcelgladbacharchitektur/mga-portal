<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { TimeEntry, Project } from '$lib/types';
  import { Clock, Plus, Calendar, Timer, Pause, Play, Check, Trash } from 'phosphor-svelte';
  import { page } from '$app/stores';
  
  interface TimeEntryWithProject extends TimeEntry {
    project?: Project;
  }
  
  let timeEntries: TimeEntryWithProject[] = [];
  let projects: Project[] = [];
  let loading = true;
  let error = '';
  let selectedDate = new Date().toISOString().split('T')[0];
  let activeTimer: { projectId: string; startTime: Date } | null = null;
  let timerInterval: number | null = null;
  let elapsedTime = '00:00:00';
  
  // New entry form
  let showAddDialog = false;
  let newEntry = {
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 0,
    hours: 0,
    minutes: 0,
    description: '',
    billable: true
  };
  
  async function loadTimeEntries() {
    try {
      const response = await fetch(`/api/time-entries?date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch time entries');
      timeEntries = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
  }
  
  async function loadProjects() {
    try {
      const response = await fetch('/api/projects-supabase');
      if (!response.ok) throw new Error('Failed to fetch projects');
      projects = await response.json();
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  }
  
  function startTimer(projectId: string) {
    activeTimer = { projectId, startTime: new Date() };
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  }
  
  function stopTimer() {
    if (!activeTimer || !timerInterval) return;
    
    clearInterval(timerInterval);
    const duration = Math.floor((new Date().getTime() - activeTimer.startTime.getTime()) / 1000 / 60);
    
    // Create time entry
    createTimeEntry({
      project_id: activeTimer.projectId,
      date: selectedDate,
      duration_minutes: duration,
      description: 'Timer-Erfassung',
      billable: true
    });
    
    activeTimer = null;
    elapsedTime = '00:00:00';
  }
  
  function updateTimer() {
    if (!activeTimer) return;
    
    const elapsed = new Date().getTime() - activeTimer.startTime.getTime();
    const hours = Math.floor(elapsed / 1000 / 60 / 60);
    const minutes = Math.floor((elapsed / 1000 / 60) % 60);
    const seconds = Math.floor((elapsed / 1000) % 60);
    
    elapsedTime = [hours, minutes, seconds]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
  }
  
  async function createTimeEntry(data: any) {
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to create time entry');
      
      await loadTimeEntries();
      showAddDialog = false;
      resetNewEntry();
    } catch (err) {
      console.error('Error creating time entry:', err);
      alert('Fehler beim Erstellen des Zeiteintrags');
    }
  }
  
  async function deleteTimeEntry(id: string) {
    if (!confirm('Zeiteintrag wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete time entry');
      
      // Remove from local state immediately for better UX
      timeEntries = timeEntries.filter(entry => entry.id !== id);
      
      // Then reload to ensure consistency
      await loadTimeEntries();
    } catch (err) {
      console.error('Error deleting time entry:', err);
      alert('Fehler beim Löschen des Zeiteintrags');
      // Reload in case of error to restore correct state
      await loadTimeEntries();
    }
  }
  
  function resetNewEntry() {
    newEntry = {
      project_id: '',
      date: selectedDate,
      duration_minutes: 0,
      hours: 0,
      minutes: 0,
      description: '',
      billable: true
    };
  }
  
  function handleSubmit() {
    const duration = newEntry.hours * 60 + newEntry.minutes;
    createTimeEntry({
      ...newEntry,
      duration_minutes: duration
    });
  }
  
  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }
  
  function getTotalHours() {
    return timeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
  }
  
  function getBillableHours() {
    return timeEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
  }
  
  onMount(async () => {
    loading = true;
    await Promise.all([loadTimeEntries(), loadProjects()]);
    loading = false;
    
    // Check if we should open create dialog
    if ($page.url.searchParams.get('action') === 'new') {
      showAddDialog = true;
    }
  });
  
  $: selectedDate, loadTimeEntries();
  
  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });
</script>

<div class="container mx-auto p-4">
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
    <h1 class="text-3xl font-bold">Zeiterfassung</h1>
    
    <div>
      <input
        type="date"
        bind:value={selectedDate}
        class="px-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
      />
    </div>
  </div>
  
  <!-- Timer Section -->
  {#if activeTimer}
    <div class="bg-accent-green/10 border border-accent-green/30 rounded-lg p-4 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-ink/60">Aktive Zeiterfassung</p>
          <p class="font-semibold">
            {projects.find(p => p.id === activeTimer.projectId)?.name || 'Unbekanntes Projekt'}
          </p>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-2xl font-mono">{elapsedTime}</span>
          <button
            on:click={stopTimer}
            class="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Pause size={20} />
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Summary Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
      <div class="flex items-center gap-3">
        <Clock size={24} class="text-accent-green" />
        <div>
          <p class="text-sm text-ink/60">Gesamt</p>
          <p class="text-xl font-semibold">{formatDuration(getTotalHours())}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
      <div class="flex items-center gap-3">
        <Timer size={24} class="text-blue-500" />
        <div>
          <p class="text-sm text-ink/60">Abrechenbar</p>
          <p class="text-xl font-semibold">{formatDuration(getBillableHours())}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
      <div class="flex items-center gap-3">
        <Calendar size={24} class="text-purple-500" />
        <div>
          <p class="text-sm text-ink/60">Einträge</p>
          <p class="text-xl font-semibold">{timeEntries.length}</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Quick Timer Buttons -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
    {#each projects.filter(p => p.status === 'ACTIVE') as project}
      <button
        on:click={() => startTimer(project.id)}
        disabled={!!activeTimer}
        class="bg-white rounded-lg shadow-sm border border-ink/10 p-4 hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed text-left"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">{project.name}</p>
            <p class="text-sm text-ink/60">{project.project_id}</p>
          </div>
          <Play size={20} class="text-accent-green" />
        </div>
      </button>
    {/each}
  </div>
  
  <!-- Time Entries List -->
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
    </div>
  {:else if timeEntries.length === 0}
    <div class="text-center py-12">
      <Clock size={48} class="mx-auto text-ink/30 mb-4" />
      <p class="text-ink/60">Keine Zeiteinträge für diesen Tag</p>
      <p class="text-sm text-ink/40 mt-2">Nutzen Sie den + Button oder die Schnell-Timer</p>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 overflow-hidden">
      <table class="w-full">
        <thead class="bg-ink/5 text-sm">
          <tr>
            <th class="text-left px-4 py-3">Projekt</th>
            <th class="text-left px-4 py-3">Beschreibung</th>
            <th class="text-center px-4 py-3">Dauer</th>
            <th class="text-center px-4 py-3">Abrechenbar</th>
            <th class="text-right px-4 py-3">Aktionen</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink/10">
          {#each timeEntries as entry}
            <tr class="hover:bg-ink/5 transition-colors">
              <td class="px-4 py-3">
                <p class="font-medium">{entry.project?.name || 'Unbekannt'}</p>
                <p class="text-sm text-ink/60">{entry.project?.project_id}</p>
              </td>
              <td class="px-4 py-3 text-sm">
                {entry.description || '-'}
              </td>
              <td class="px-4 py-3 text-center font-mono">
                {formatDuration(entry.duration_minutes)}
              </td>
              <td class="px-4 py-3 text-center">
                {#if entry.billable}
                  <Check size={20} class="mx-auto text-green-600" />
                {:else}
                  <span class="text-ink/30">-</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  on:click={() => deleteTimeEntry(entry.id)}
                  class="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash size={18} />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Add Time Entry Dialog -->
{#if showAddDialog}
  <div class="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-ink/5">
      <h2 class="text-xl font-bold mb-4">Neue Zeiterfassung</h2>
      
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-ink mb-1">
            Projekt *
          </label>
          <select
            bind:value={newEntry.project_id}
            required
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50"
          >
            <option value="">Bitte wählen...</option>
            {#each projects as project}
              <option value={project.id}>
                {project.project_id} - {project.name}
              </option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-ink mb-1">
            Datum
          </label>
          <input
            type="date"
            bind:value={newEntry.date}
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-ink mb-1">
            Dauer *
          </label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                bind:value={newEntry.hours}
                min="0"
                placeholder="Stunden"
                class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50"
              />
            </div>
            <div>
              <input
                type="number"
                bind:value={newEntry.minutes}
                min="0"
                max="59"
                placeholder="Minuten"
                class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-ink mb-1">
            Beschreibung
          </label>
          <textarea
            bind:value={newEntry.description}
            rows="3"
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            placeholder="Was wurde gemacht?"
          ></textarea>
        </div>
        
        <div class="flex items-center">
          <input
            type="checkbox"
            id="billable"
            bind:checked={newEntry.billable}
            class="mr-2"
          />
          <label for="billable" class="text-sm">
            Abrechenbar
          </label>
        </div>
        
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            on:click={() => showAddDialog = false}
            class="px-4 py-2 text-ink bg-ink/10 rounded-md hover:bg-ink/20 transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={!newEntry.project_id || (newEntry.hours === 0 && newEntry.minutes === 0)}
            class="px-4 py-2 bg-accent-green text-white rounded-md hover:bg-accent-green/90 transition-colors disabled:bg-ink/30"
          >
            Speichern
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

