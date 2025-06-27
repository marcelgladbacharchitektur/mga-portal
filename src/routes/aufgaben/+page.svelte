<script lang="ts">
  import { onMount } from 'svelte';
  import { CheckCircle, Plus, Calendar, Flag, X, MagnifyingGlass, Funnel } from 'phosphor-svelte';
  
  interface Task {
    id: string;
    title: string;
    notes?: string;
    due?: string;
    completed?: string;
    status: 'needsAction' | 'completed';
    parent?: string;
    links?: Array<{ type: string; description: string; link: string }>;
  }
  
  let tasks: Task[] = [];
  let filteredTasks: Task[] = [];
  let taskLists: any[] = [];
  let loading = true;
  let error = '';
  let selectedList = '';
  let searchQuery = '';
  let filterStatus = 'all';
  let showCreateDialog = false;
  let newTask = {
    title: '',
    notes: '',
    due: ''
  };
  
  async function loadTaskLists() {
    try {
      const response = await fetch('/api/tasks/lists');
      if (!response.ok) {
        if (response.status === 401) {
          error = 'Nicht mit Google verbunden';
          return;
        }
        throw new Error('Failed to load task lists');
      }
      taskLists = await response.json();
      if (taskLists.length > 0 && !selectedList) {
        selectedList = taskLists[0].id;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
  }
  
  async function loadTasks() {
    if (!selectedList) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/tasks?listId=${selectedList}`);
      if (!response.ok) {
        if (response.status === 401) {
          error = 'Nicht mit Google verbunden';
          return;
        }
        throw new Error('Failed to load tasks');
      }
      tasks = await response.json();
      filterTasks();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
  
  function filterTasks() {
    filteredTasks = tasks.filter(task => {
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'active' && task.status === 'needsAction') ||
        (filterStatus === 'completed' && task.status === 'completed');
      
      return matchesSearch && matchesStatus;
    });
  }
  
  async function createTask() {
    if (!newTask.title || !selectedList) return;
    
    try {
      const response = await fetch(`/api/tasks?listId=${selectedList}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      
      if (!response.ok) throw new Error('Failed to create task');
      
      await loadTasks();
      showCreateDialog = false;
      resetNewTask();
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Fehler beim Erstellen der Aufgabe');
    }
  }
  
  async function toggleTask(task: Task) {
    try {
      const response = await fetch(`/api/tasks/${task.id}?listId=${selectedList}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: task.status === 'completed' ? 'needsAction' : 'completed',
          completed: task.status === 'completed' ? null : new Date().toISOString()
        })
      });
      
      if (!response.ok) throw new Error('Failed to update task');
      
      await loadTasks();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  }
  
  async function deleteTask(taskId: string) {
    if (!confirm('Aufgabe wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}?listId=${selectedList}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete task');
      
      await loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  }
  
  function resetNewTask() {
    newTask = {
      title: '',
      notes: '',
      due: ''
    };
  }
  
  function formatDate(dateString?: string) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  onMount(async () => {
    await loadTaskLists();
    if (selectedList) {
      await loadTasks();
    }
  });
  
  $: searchQuery, filterStatus, filterTasks();
  $: selectedList, loadTasks();
</script>

<div class="container mx-auto p-4">
  <div class="mb-6">
    <h1 class="text-3xl font-bold mb-4">Aufgaben</h1>
    
    <!-- Controls -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- List Selector -->
      {#if taskLists.length > 0}
        <select
          bind:value={selectedList}
          class="px-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
        >
          {#each taskLists as list}
            <option value={list.id}>{list.title}</option>
          {/each}
        </select>
      {/if}
      
      <!-- Search -->
      <div class="relative flex-1 max-w-md">
        <MagnifyingGlass size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="Aufgaben suchen..."
          class="w-full pl-10 pr-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
        />
      </div>
      
      <!-- Status Filter -->
      <div class="flex gap-1 bg-ink/5 rounded-lg p-1">
        <button
          on:click={() => filterStatus = 'all'}
          class="px-3 py-1.5 rounded text-sm {filterStatus === 'all' ? 'bg-white shadow-sm' : 'hover:bg-ink/5'} transition-all"
        >
          Alle
        </button>
        <button
          on:click={() => filterStatus = 'active'}
          class="px-3 py-1.5 rounded text-sm {filterStatus === 'active' ? 'bg-white shadow-sm' : 'hover:bg-ink/5'} transition-all"
        >
          Offen
        </button>
        <button
          on:click={() => filterStatus = 'completed'}
          class="px-3 py-1.5 rounded text-sm {filterStatus === 'completed' ? 'bg-white shadow-sm' : 'hover:bg-ink/5'} transition-all"
        >
          Erledigt
        </button>
      </div>
      
      <!-- Add Button -->
      <button
        on:click={() => showCreateDialog = true}
        class="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors flex items-center gap-2"
      >
        <Plus size={20} />
        <span>Neue Aufgabe</span>
      </button>
    </div>
  </div>
  
  {#if error}
    <div class="bg-red-100/50 border border-red-400/50 text-red-700 px-4 py-3 rounded mb-4">
      <p class="font-medium">{error}</p>
      {#if error.includes('Google')}
        <a 
          href="/api/auth/google?action=login" 
          class="inline-block mt-2 px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-800 transition-colors"
        >
          Mit Google anmelden
        </a>
      {/if}
    </div>
  {/if}
  
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
    </div>
  {:else if filteredTasks.length === 0}
    <div class="text-center py-12">
      <CheckCircle size={48} class="mx-auto text-ink/30 mb-4" />
      <p class="text-ink/60">
        {searchQuery || filterStatus !== 'all' ? 'Keine Aufgaben gefunden' : 'Keine Aufgaben vorhanden'}
      </p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each filteredTasks as task}
        <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4 hover:shadow-md transition-shadow">
          <div class="flex items-start gap-3">
            <button
              on:click={() => toggleTask(task)}
              class="mt-0.5"
            >
              <CheckCircle 
                size={24} 
                weight={task.status === 'completed' ? 'fill' : 'regular'}
                class="{task.status === 'completed' ? 'text-green-600' : 'text-ink/30'} hover:text-green-600 transition-colors"
              />
            </button>
            
            <div class="flex-1">
              <h3 class="font-medium {task.status === 'completed' ? 'line-through text-ink/50' : ''}">
                {task.title}
              </h3>
              {#if task.notes}
                <p class="text-sm text-ink/60 mt-1">{task.notes}</p>
              {/if}
              {#if task.due}
                <div class="flex items-center gap-1 mt-2">
                  <Calendar size={16} class="text-ink/40" />
                  <span class="text-sm text-ink/60">{formatDate(task.due)}</span>
                </div>
              {/if}
            </div>
            
            <button
              on:click={() => deleteTask(task.id)}
              class="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Task Dialog -->
{#if showCreateDialog}
  <div class="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
      <h2 class="text-xl font-bold mb-4">Neue Aufgabe</h2>
      
      <form on:submit|preventDefault={createTask} class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-ink mb-1">
            Titel *
          </label>
          <input
            type="text"
            bind:value={newTask.title}
            required
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            placeholder="Aufgabe eingeben..."
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-ink mb-1">
            Notizen
          </label>
          <textarea
            bind:value={newTask.notes}
            rows="3"
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            placeholder="Zusätzliche Informationen..."
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-ink mb-1">
            Fälligkeitsdatum
          </label>
          <input
            type="date"
            bind:value={newTask.due}
            class="w-full px-3 py-2 border border-ink/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-green/50"
          />
        </div>
        
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            on:click={() => showCreateDialog = false}
            class="px-4 py-2 text-ink bg-ink/10 rounded-md hover:bg-ink/20 transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-accent-green text-white rounded-md hover:bg-accent-green/90 transition-colors"
          >
            Erstellen
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}