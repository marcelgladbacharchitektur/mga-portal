<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    FolderOpen, 
    Clock, 
    Users, 
    Plus, 
    Calendar,
    CheckCircle,
    Timer,
    Receipt,
    GoogleDriveLogo
  } from 'phosphor-svelte';
  
  interface DashboardStats {
    activeProjects: number;
    todayHours: number;
    openTasks: number;
    totalContacts: number;
  }
  
  let stats: DashboardStats = {
    activeProjects: 0,
    todayHours: 0,
    openTasks: 0,
    totalContacts: 0
  };
  
  let recentProjects: any[] = [];
  let todayEntries: any[] = [];
  let loading = true;
  
  async function loadDashboard() {
    try {
      // Load stats
      const [projectsRes, timeRes, contactsRes] = await Promise.all([
        fetch('/api/projects-supabase'),
        fetch('/api/time-entries?date=' + new Date().toISOString().split('T')[0]),
        fetch('/api/contacts')
      ]);
      
      const projects = await projectsRes.json();
      const timeEntries = await timeRes.json();
      const contacts = await contactsRes.json();
      
      stats.activeProjects = projects.filter((p: any) => p.status === 'ACTIVE').length;
      stats.todayHours = timeEntries.reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0) / 60;
      stats.totalContacts = contacts.length;
      
      recentProjects = projects.slice(0, 3);
      todayEntries = timeEntries.slice(0, 5);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    loadDashboard();
  });
  
</script>

<div class="container mx-auto p-4">
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2">Dashboard</h1>
    <p class="text-ink/60">Willkommen im MGA Portal</p>
  </div>
  
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
    </div>
  {:else}
    <!-- Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <div class="flex items-center justify-between mb-2">
          <FolderOpen size={24} class="text-accent-green" />
          <span class="text-2xl font-bold">{stats.activeProjects}</span>
        </div>
        <p class="text-sm text-ink/60">Aktive Projekte</p>
      </div>
      
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <div class="flex items-center justify-between mb-2">
          <Timer size={24} class="text-blue-500" />
          <span class="text-2xl font-bold">{stats.todayHours.toFixed(1)}h</span>
        </div>
        <p class="text-sm text-ink/60">Heute erfasst</p>
      </div>
      
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <div class="flex items-center justify-between mb-2">
          <CheckCircle size={24} class="text-green-500" />
          <span class="text-2xl font-bold">{stats.openTasks}</span>
        </div>
        <p class="text-sm text-ink/60">Offene Aufgaben</p>
      </div>
      
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <div class="flex items-center justify-between mb-2">
          <Users size={24} class="text-purple-500" />
          <span class="text-2xl font-bold">{stats.totalContacts}</span>
        </div>
        <p class="text-sm text-ink/60">Kontakte</p>
      </div>
    </div>
    
    <div class="grid lg:grid-cols-2 gap-8">
      <!-- Recent Projects -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Aktuelle Projekte</h2>
          <a href="/projekte" class="text-sm text-accent-green hover:underline">
            Alle anzeigen →
          </a>
        </div>
        <div class="space-y-3">
          {#each recentProjects as project}
            <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h3 class="font-medium">{project.name}</h3>
                  <p class="text-sm text-ink/60">{project.project_id}</p>
                </div>
                <span class="text-xs px-2 py-1 rounded-full bg-accent-green/20 text-accent-green">
                  Aktiv
                </span>
              </div>
              <div class="flex gap-3 mt-3">
                <a
                  href="/projekte/{project.id}"
                  class="text-xs text-ink/60 hover:text-accent-green"
                >
                  Details
                </a>
                {#if project.drive_folder_url}
                  <a
                    href={project.drive_folder_url}
                    target="_blank"
                    class="text-xs text-ink/60 hover:text-accent-green"
                  >
                    Drive
                  </a>
                {/if}
                <a
                  href="/zeiterfassung?project={project.id}"
                  class="text-xs text-ink/60 hover:text-accent-green"
                >
                  Zeit erfassen
                </a>
              </div>
            </div>
          {/each}
          
          {#if recentProjects.length === 0}
            <p class="text-sm text-ink/60 text-center py-4">
              Noch keine Projekte vorhanden
            </p>
          {/if}
        </div>
      </div>
      
      <!-- Today's Time Entries -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Heutige Zeiterfassung</h2>
          <a href="/zeiterfassung" class="text-sm text-accent-green hover:underline">
            Alle anzeigen →
          </a>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-ink/10 overflow-hidden">
          {#if todayEntries.length > 0}
            <div class="divide-y divide-ink/10">
              {#each todayEntries as entry}
                <div class="px-4 py-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-sm">{entry.project?.name || 'Unbekannt'}</p>
                      <p class="text-xs text-ink/60">{entry.description || 'Keine Beschreibung'}</p>
                    </div>
                    <span class="text-sm font-mono">
                      {Math.floor(entry.duration_minutes / 60)}:{(entry.duration_minutes % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-ink/60 text-center py-8">
              Noch keine Zeiterfassung heute
            </p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
