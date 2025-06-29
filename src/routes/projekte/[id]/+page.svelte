<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import type { Project } from '$lib/types';
  import ProjectContacts from '$lib/components/ProjectContacts.svelte';
  import ProjectTimeOverview from '$lib/components/ProjectTimeOverview.svelte';
  import { GoogleDriveLogo, Calendar, ListChecks, Clock, Folder, ArrowLeft, Pencil, Check, X } from 'phosphor-svelte';
  
  let project: Project | null = null;
  let loading = true;
  let error = '';
  let editingDriveFolder = false;
  let driveFolderId = '';
  let savingDriveFolder = false;
  
  // Project editing variables
  let editingProject = false;
  let editProjectName = '';
  let editProjectId = '';
  let savingProject = false;
  
  // Additional project fields editing
  let editingDetails = false;
  let editForm = {
    name: '',
    project_id: '',
    status: '',
    cadastral_community: '',
    plot_area: '',
    budget_hours: '',
    calendar_id: '',
    tasks_list_id: '',
    description: ''
  };
  let savingDetails = false;
  
  $: projectId = $page.params.id;
  
  async function loadProject() {
    loading = true;
    error = '';
    
    try {
      const response = await fetch(`/api/projects-supabase/${projectId}`);
      if (!response.ok) throw new Error('Failed to load project');
      project = await response.json();
      driveFolderId = project.drive_folder_id || '';
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
  
  async function saveDriveFolder() {
    if (!project) return;
    
    savingDriveFolder = true;
    try {
      const response = await fetch(`/api/projects-supabase/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drive_folder_id: driveFolderId })
      });
      
      if (!response.ok) throw new Error('Failed to update drive folder');
      
      project.drive_folder_id = driveFolderId;
      editingDriveFolder = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      savingDriveFolder = false;
    }
  }
  
  function startEditingDriveFolder() {
    driveFolderId = project?.drive_folder_id || '';
    editingDriveFolder = true;
  }
  
  function cancelEditingDriveFolder() {
    driveFolderId = project?.drive_folder_id || '';
    editingDriveFolder = false;
  }
  
  function startProjectEdit() {
    editProjectName = project?.name || '';
    editProjectId = project?.project_id || '';
    editingProject = true;
  }
  
  function cancelProjectEdit() {
    editProjectName = project?.name || '';
    editProjectId = project?.project_id || '';
    editingProject = false;
  }
  
  async function saveProjectChanges() {
    if (!project) return;
    
    savingProject = true;
    try {
      const oldName = project.name;
      const oldProjectId = project.project_id;
      
      const response = await fetch(`/api/projects-supabase/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: editProjectName,
          project_id: editProjectId,
          renameDriveFolder: true,
          oldName: oldName,
          oldProjectId: oldProjectId
        })
      });
      
      if (!response.ok) throw new Error('Failed to update project');
      
      const updatedProject = await response.json();
      project = updatedProject;
      editingProject = false;
      
      // Reload project to get latest data
      await loadProject();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      savingProject = false;
    }
  }
  
  function startEditingDetails() {
    editForm = {
      name: project?.name || '',
      project_id: project?.project_id || '',
      status: project?.status || 'ACTIVE',
      cadastral_community: project?.cadastral_community || '',
      plot_area: project?.plot_area?.toString() || '',
      budget_hours: project?.budget_hours?.toString() || '',
      calendar_id: project?.calendar_id || '',
      tasks_list_id: project?.tasks_list_id || '',
      description: project?.description || ''
    };
    editingDetails = true;
  }
  
  function cancelEditingDetails() {
    editingDetails = false;
  }
  
  async function saveDetailChanges() {
    if (!project) return;
    
    savingDetails = true;
    try {
      const updateData: any = {
        name: editForm.name,
        project_id: editForm.project_id,
        status: editForm.status,
        cadastral_community: editForm.cadastral_community || null,
        plot_area: editForm.plot_area ? parseFloat(editForm.plot_area) : null,
        budget_hours: editForm.budget_hours ? parseInt(editForm.budget_hours) : null,
        calendar_id: editForm.calendar_id || null,
        tasks_list_id: editForm.tasks_list_id || null,
        description: editForm.description || null
      };
      
      // Only rename drive folder if name or project_id changed
      if (editForm.name !== project.name || editForm.project_id !== project.project_id) {
        updateData.renameDriveFolder = true;
      }
      
      const response = await fetch(`/api/projects-supabase/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) throw new Error('Failed to update project');
      
      const updatedProject = await response.json();
      project = updatedProject;
      editingDetails = false;
      
      // Reload project to get latest data
      await loadProject();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      savingDetails = false;
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
        <div class="flex-1">
          {#if editingProject}
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-ink mb-1">Projektname</label>
                <input
                  type="text"
                  bind:value={editProjectName}
                  class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-ink mb-1">Projektnummer</label>
                <input
                  type="text"
                  bind:value={editProjectId}
                  class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50 font-mono"
                />
              </div>
              <div class="flex gap-2">
                <button
                  on:click={saveProjectChanges}
                  disabled={savingProject}
                  class="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 disabled:bg-ink/30 flex items-center gap-2"
                >
                  {#if savingProject}
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {:else}
                    <Check size={16} />
                  {/if}
                  Speichern
                </button>
                <button
                  on:click={cancelProjectEdit}
                  class="px-4 py-2 bg-ink/10 text-ink rounded-lg hover:bg-ink/20"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          {:else}
            <div class="flex items-start gap-3">
              <div>
                <h1 class="text-3xl font-bold">{project.name}</h1>
                <p class="text-lg text-ink/60 font-mono">{project.project_id}</p>
              </div>
              <button
                on:click={startProjectEdit}
                class="p-2 text-ink/60 hover:bg-ink/5 rounded-lg transition-colors"
                title="Projektdaten bearbeiten"
              >
                <Pencil size={20} />
              </button>
            </div>
          {/if}
        </div>
        <span class={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
          {getStatusLabel(project.status)}
        </span>
      </div>
      
      <!-- Project Details -->
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6 mb-8">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold">Projektdetails</h3>
          {#if !editingDetails}
            <button
              on:click={startEditingDetails}
              class="p-2 text-ink/60 hover:bg-ink/5 rounded-lg transition-colors"
              title="Projektdetails bearbeiten"
            >
              <Pencil size={20} />
            </button>
          {/if}
        </div>
        
        {#if editingDetails}
          <div class="space-y-6">
            <!-- Basic Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-ink mb-2">Projektname</label>
                <input
                  type="text"
                  bind:value={editForm.name}
                  class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-ink mb-2">Projektnummer</label>
                <input
                  type="text"
                  bind:value={editForm.project_id}
                  class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50 font-mono"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-ink mb-2">Status</label>
                <select
                  bind:value={editForm.status}
                  class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
                >
                  <option value="ACTIVE">Aktiv</option>
                  <option value="ON_HOLD">Pausiert</option>
                  <option value="COMPLETED">Abgeschlossen</option>
                  <option value="ARCHIVED">Archiviert</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-ink mb-2">Budget (Stunden)</label>
                <input
                  type="number"
                  bind:value={editForm.budget_hours}
                  placeholder="Geplante Stunden"
                  class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
                />
              </div>
            </div>
            
            <!-- Location Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-ink mb-2">Katastralgemeinde</label>
                <input
                  type="text"
                  bind:value={editForm.cadastral_community}
                  placeholder="z.B. Linz"
                  class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-ink mb-2">Grundstücksfläche (m²)</label>
                <input
                  type="number"
                  step="0.01"
                  bind:value={editForm.plot_area}
                  placeholder="Fläche in m²"
                  class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
                />
              </div>
            </div>
            
            <!-- Integration IDs -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-ink mb-2">Google Calendar ID</label>
                <input
                  type="text"
                  bind:value={editForm.calendar_id}
                  placeholder="calendar-id@group.calendar.google.com"
                  class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50 font-mono text-sm"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-ink mb-2">Google Tasks Liste ID</label>
                <input
                  type="text"
                  bind:value={editForm.tasks_list_id}
                  placeholder="Tasks Liste ID"
                  class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50 font-mono text-sm"
                />
              </div>
            </div>
            
            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-ink mb-2">Beschreibung</label>
              <textarea
                bind:value={editForm.description}
                rows="3"
                placeholder="Projektbeschreibung..."
                class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
              ></textarea>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-3 pt-4 border-t border-ink/10">
              <button
                on:click={saveDetailChanges}
                disabled={savingDetails}
                class="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 disabled:bg-ink/30 flex items-center gap-2"
              >
                {#if savingDetails}
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {:else}
                  <Check size={16} />
                {/if}
                Speichern
              </button>
              <button
                on:click={cancelEditingDetails}
                class="px-4 py-2 bg-ink/10 text-ink rounded-lg hover:bg-ink/20"
              >
                Abbrechen
              </button>
            </div>
          </div>
        {:else}
          <!-- Read-only view -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-ink/60">Status</p>
              <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
            </div>
            
            {#if project.cadastral_community}
              <div class="space-y-1">
                <p class="text-sm text-ink/60">Katastralgemeinde</p>
                <p class="font-medium">{project.cadastral_community}</p>
              </div>
            {/if}
            
            {#if project.plot_area}
              <div class="space-y-1">
                <p class="text-sm text-ink/60">Grundstücksfläche</p>
                <p class="font-medium">{project.plot_area} m²</p>
              </div>
            {/if}
            
            {#if project.budget_hours}
              <div class="space-y-1">
                <p class="text-sm text-ink/60">Budget</p>
                <p class="font-medium">{project.budget_hours} Stunden</p>
              </div>
            {/if}
            
            {#if project.calendar_id}
              <div class="space-y-1">
                <p class="text-sm text-ink/60">Calendar ID</p>
                <p class="font-mono text-sm text-ink/70">{project.calendar_id}</p>
              </div>
            {/if}
            
            {#if project.tasks_list_id}
              <div class="space-y-1">
                <p class="text-sm text-ink/60">Tasks Liste ID</p>
                <p class="font-mono text-sm text-ink/70">{project.tasks_list_id}</p>
              </div>
            {/if}
            
            <div class="space-y-1">
              <p class="text-sm text-ink/60">Erstellt am</p>
              <p class="font-medium">
                {new Date(project.created_at || '').toLocaleDateString('de-AT')}
              </p>
            </div>
            
            {#if project.description}
              <div class="col-span-full space-y-1 pt-4 border-t border-ink/10">
                <p class="text-sm text-ink/60">Beschreibung</p>
                <p class="text-ink/80">{project.description}</p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- Drive Folder Configuration -->
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6 mb-8">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="text-lg font-semibold mb-2 flex items-center gap-2">
              <Folder size={20} />
              Google Drive Ordner
            </h3>
            {#if !editingDriveFolder}
              <p class="text-sm text-ink/60 mb-2">
                {#if project.drive_folder_id}
                  Ordner-ID: <span class="font-mono">{project.drive_folder_id}</span>
                {:else}
                  Kein Drive-Ordner konfiguriert
                {/if}
              </p>
            {:else}
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  bind:value={driveFolderId}
                  placeholder="Drive Ordner-ID eingeben"
                  class="flex-1 px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
                />
                <button
                  on:click={saveDriveFolder}
                  disabled={savingDriveFolder}
                  class="p-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 disabled:bg-ink/30"
                  title="Speichern"
                >
                  {#if savingDriveFolder}
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {:else}
                    <Check size={20} />
                  {/if}
                </button>
                <button
                  on:click={cancelEditingDriveFolder}
                  class="p-2 bg-ink/10 text-ink rounded-lg hover:bg-ink/20"
                  title="Abbrechen"
                >
                  <X size={20} />
                </button>
              </div>
              <p class="text-xs text-ink/60 mt-2">
                Sie finden die ID in der Drive-URL nach "folders/"
              </p>
            {/if}
          </div>
          {#if !editingDriveFolder}
            <button
              on:click={startEditingDriveFolder}
              class="p-2 text-ink/60 hover:bg-ink/5 rounded-lg transition-colors"
              title="Bearbeiten"
            >
              <Pencil size={20} />
            </button>
          {/if}
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {#if project.drive_folder_id}
          <a
            href="/projekte/{project.id}/drive"
            class="flex items-center justify-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-ink/10 hover:shadow-md transition-shadow"
          >
            <Folder size={24} class="text-ink/60" />
            <span>Drive Browser</span>
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
      
      <!-- Time Overview -->
      <ProjectTimeOverview projectId={project.id} />
    </div>
  {/if}
</div>