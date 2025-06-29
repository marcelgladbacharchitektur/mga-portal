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
    GoogleDriveLogo,
    CurrencyCircleDollar,
    Gear,
    ListChecks,
    Folder
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
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">Dashboard</h1>
        <p class="text-ink/60">Willkommen im MGA Portal</p>
      </div>
      <div class="flex gap-3">
        <a
          href="/projekte?action=new"
          class="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          <span class="hidden sm:inline">Neues Projekt</span>
        </a>
        <a
          href="/zeiterfassung"
          class="px-4 py-2 bg-white border border-ink/20 text-ink rounded-lg hover:bg-ink/5 flex items-center gap-2 transition-colors"
        >
          <Clock size={20} />
          <span class="hidden sm:inline">Zeit erfassen</span>
        </a>
      </div>
    </div>
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
            <a 
              href="/projekte/{project.id}"
              class="block bg-white rounded-lg shadow-sm border border-ink/10 p-5 hover:shadow-md hover:border-accent-green/20 transition-all group"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <h3 class="font-semibold text-lg group-hover:text-accent-green transition-colors">{project.name}</h3>
                  <p class="text-sm text-ink/60 font-mono">{project.project_id}</p>
                </div>
                <span class={`text-xs px-2 py-1 rounded-full font-medium ${
                  project.status === 'ACTIVE' ? 'bg-accent-green/20 text-accent-green' :
                  project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-800' :
                  project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                  'bg-ink/10 text-ink/60'
                }`}>
                  {project.status === 'ACTIVE' ? 'Aktiv' :
                   project.status === 'ON_HOLD' ? 'Pausiert' :
                   project.status === 'COMPLETED' ? 'Abgeschlossen' :
                   'Archiviert'}
                </span>
              </div>
              
              {#if project.cadastral_community || project.plot_area || project.budget_hours}
                <div class="grid grid-cols-3 gap-4 text-sm mb-3">
                  {#if project.cadastral_community}
                    <div>
                      <p class="text-ink/60 text-xs">KG</p>
                      <p class="font-medium">{project.cadastral_community}</p>
                    </div>
                  {/if}
                  {#if project.plot_area}
                    <div>
                      <p class="text-ink/60 text-xs">Fläche</p>
                      <p class="font-medium">{project.plot_area} m²</p>
                    </div>
                  {/if}
                  {#if project.budget_hours}
                    <div>
                      <p class="text-ink/60 text-xs">Budget</p>
                      <p class="font-medium">{project.budget_hours}h</p>
                    </div>
                  {/if}
                </div>
              {/if}
              
              <div class="flex items-center gap-3 pt-3 border-t border-ink/10 flex-wrap">
                <!-- Projekt Details anzeigen -->
                <button
                  on:click|preventDefault|stopPropagation={() => window.location.href = `/projekte/${project.id}`}
                  class="flex items-center gap-1 text-sm text-accent-green hover:text-accent-green/80 transition-colors font-medium"
                >
                  <FolderOpen size={16} />
                  <span>Details</span>
                </button>
                
                <!-- Drive Browser (zeige immer an) -->
                <button
                  on:click|preventDefault|stopPropagation={() => window.open(`/projekte/${project.id}/drive`, '_blank')}
                  class="flex items-center gap-1 text-sm text-ink/60 hover:text-accent-green transition-colors"
                >
                  <Folder size={16} />
                  <span>Browser</span>
                </button>
                
                <!-- Direkter Google Drive Link -->
                {#if project.drive_folder_id || project.drive_folder_url}
                  <button
                    on:click|preventDefault|stopPropagation={() => {
                      let driveUrl = '';
                      if (project.drive_folder_id) {
                        driveUrl = `https://drive.google.com/drive/folders/${project.drive_folder_id}`;
                      } else if (project.drive_folder_url) {
                        driveUrl = project.drive_folder_url;
                      }
                      if (driveUrl) window.open(driveUrl, '_blank');
                    }}
                    class="flex items-center gap-1 text-sm text-ink/60 hover:text-accent-green transition-colors"
                  >
                    <GoogleDriveLogo size={16} />
                    <span>Drive</span>
                  </button>
                {/if}
                
                <!-- Zeit erfassen -->
                <button
                  on:click|preventDefault|stopPropagation={() => window.location.href = `/zeiterfassung?project=${project.id}`}
                  class="flex items-center gap-1 text-sm text-ink/60 hover:text-accent-green transition-colors"
                >
                  <Timer size={16} />
                  <span>Zeit</span>
                </button>
                
                <!-- Kalender -->
                {#if project.calendar_id}
                  <button
                    on:click|preventDefault|stopPropagation
                    class="flex items-center gap-1 text-sm text-ink/60 hover:text-accent-green transition-colors"
                  >
                    <Calendar size={16} />
                    <span>Kalender</span>
                  </button>
                {/if}
                
                <!-- Tasks -->
                {#if project.tasks_list_id}
                  <button
                    on:click|preventDefault|stopPropagation
                    class="flex items-center gap-1 text-sm text-ink/60 hover:text-accent-green transition-colors"
                  >
                    <ListChecks size={16} />
                    <span>Tasks</span>
                  </button>
                {/if}
                
                <!-- Kontakte (zeige immer an) -->
                <button
                  on:click|preventDefault|stopPropagation={() => window.location.href = `/projekte/${project.id}#contacts`}
                  class="flex items-center gap-1 text-sm text-ink/60 hover:text-accent-green transition-colors"
                >
                  <Users size={16} />
                  <span>Kontakte</span>
                </button>
              </div>
            </a>
          {/each}
          
          {#if recentProjects.length === 0}
            <div class="bg-ink/5 rounded-lg p-8 text-center">
              <FolderOpen size={48} class="mx-auto text-ink/30 mb-4" />
              <p class="text-ink/60 mb-4">Noch keine Projekte vorhanden</p>
              <a
                href="/projekte?action=new"
                class="inline-flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors"
              >
                <Plus size={20} />
                Erstes Projekt anlegen
              </a>
            </div>
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
            <div class="p-8 text-center">
              <Timer size={48} class="mx-auto text-ink/30 mb-4" />
              <p class="text-ink/60 mb-4">Noch keine Zeiterfassung heute</p>
              <a
                href="/zeiterfassung"
                class="inline-flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors text-sm"
              >
                <Clock size={20} />
                Zeit erfassen
              </a>
            </div>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Quick Access -->
    <div class="mt-8">
      <h2 class="text-xl font-semibold mb-4">Schnellzugriff</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <a
          href="/belege"
          class="bg-white rounded-lg shadow-sm border border-ink/10 p-4 hover:shadow-md hover:border-accent-green/20 transition-all group"
        >
          <Receipt size={24} class="text-ink/60 group-hover:text-accent-green mb-2" />
          <h3 class="font-medium">Belege</h3>
          <p class="text-sm text-ink/60">Rechnungen verwalten</p>
        </a>
        
        <a
          href="/finanzen"
          class="bg-white rounded-lg shadow-sm border border-ink/10 p-4 hover:shadow-md hover:border-accent-green/20 transition-all group"
        >
          <CurrencyCircleDollar size={24} class="text-ink/60 group-hover:text-accent-green mb-2" />
          <h3 class="font-medium">Finanzen</h3>
          <p class="text-sm text-ink/60">Kontoauszüge & mehr</p>
        </a>
        
        <a
          href="/kontakte"
          class="bg-white rounded-lg shadow-sm border border-ink/10 p-4 hover:shadow-md hover:border-accent-green/20 transition-all group"
        >
          <Users size={24} class="text-ink/60 group-hover:text-accent-green mb-2" />
          <h3 class="font-medium">Kontakte</h3>
          <p class="text-sm text-ink/60">Adressbuch</p>
        </a>
        
        <a
          href="/einstellungen"
          class="bg-white rounded-lg shadow-sm border border-ink/10 p-4 hover:shadow-md hover:border-accent-green/20 transition-all group"
        >
          <Gear size={24} class="text-ink/60 group-hover:text-accent-green mb-2" />
          <h3 class="font-medium">Einstellungen</h3>
          <p class="text-sm text-ink/60">Drive & System</p>
        </a>
      </div>
    </div>
  {/if}
</div>
