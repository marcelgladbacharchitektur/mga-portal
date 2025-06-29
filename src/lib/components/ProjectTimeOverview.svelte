<script lang="ts">
  import { onMount } from 'svelte';
  import { Clock, Calendar, TrendUp, CalendarBlank, Download } from 'phosphor-svelte';
  import TimeExportPDF from './TimeExportPDFSimple.svelte';
  
  export let projectId: string;
  
  interface TimeStats {
    totalHours: number;
    thisWeekHours: number;
    thisMonthHours: number;
    lastMonthHours: number;
    dailyAverage: number;
    entriesCount: number;
    dateRange: {
      start: string;
      end: string;
    };
  }
  
  interface TimeEntry {
    id: string;
    date: string;
    duration_minutes: number;
    description?: string;
  }
  
  let stats: TimeStats | null = null;
  let recentEntries: TimeEntry[] = [];
  let loading = true;
  let error = '';
  let showPDFExport = false;
  let pdfExportParams: { start: string; end: string } | null = null;
  
  function exportProjectTime() {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    
    pdfExportParams = { start: firstOfMonth, end: today };
    showPDFExport = true;
  }
  
  async function loadTimeData() {
    try {
      // Load time entries
      const response = await fetch(`/api/projects/${projectId}/time-entries`);
      if (!response.ok) throw new Error('Failed to load time entries');
      
      const entries: TimeEntry[] = await response.json();
      
      // Calculate statistics
      const now = new Date();
      const weekStart = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      stats = {
        totalHours: entries.reduce((sum, e) => sum + ((e.duration_minutes || 0) / 60), 0),
        thisWeekHours: entries
          .filter(e => new Date(e.date) >= weekStart)
          .reduce((sum, e) => sum + ((e.duration_minutes || 0) / 60), 0),
        thisMonthHours: entries
          .filter(e => new Date(e.date) >= monthStart)
          .reduce((sum, e) => sum + ((e.duration_minutes || 0) / 60), 0),
        lastMonthHours: entries
          .filter(e => {
            const date = new Date(e.date);
            return date >= lastMonthStart && date <= lastMonthEnd;
          })
          .reduce((sum, e) => sum + ((e.duration_minutes || 0) / 60), 0),
        dailyAverage: 0,
        entriesCount: entries.length,
        dateRange: {
          start: entries.length ? entries[entries.length - 1].date : '',
          end: entries.length ? entries[0].date : ''
        }
      };
      
      // Calculate daily average
      if (entries.length > 0) {
        const firstDate = new Date(entries[entries.length - 1].date);
        const daysDiff = Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
        stats.dailyAverage = stats.totalHours / daysDiff;
      }
      
      // Get recent entries
      recentEntries = entries.slice(0, 5);
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  }
  
  onMount(() => {
    loadTimeData();
  });
</script>

<div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold flex items-center gap-2">
      <Clock size={24} class="text-ink/60" />
      Zeitübersicht
    </h2>
    <button
      on:click={exportProjectTime}
      class="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-ink/20 rounded-lg hover:bg-ink/5 transition-colors"
      title="Stundenaufstellung für diesen Monat exportieren"
    >
      <Download size={16} />
      <span>Export PDF</span>
    </button>
  </div>
  
  {#if loading}
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green"></div>
    </div>
  {:else if error}
    <div class="text-red-600 text-sm">{error}</div>
  {:else if stats}
    <!-- Statistics Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-ink/5 rounded-lg p-4">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm text-ink/60">Gesamt</span>
          <Clock size={16} class="text-ink/40" />
        </div>
        <p class="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</p>
        <p class="text-xs text-ink/60">{stats.entriesCount} Einträge</p>
      </div>
      
      <div class="bg-accent-green/10 rounded-lg p-4">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm text-ink/60">Diese Woche</span>
          <Calendar size={16} class="text-accent-green" />
        </div>
        <p class="text-2xl font-bold text-accent-green">{stats.thisWeekHours.toFixed(1)}h</p>
        <p class="text-xs text-ink/60">KW {getWeekNumber(new Date())}</p>
      </div>
      
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm text-ink/60">Dieser Monat</span>
          <CalendarBlank size={16} class="text-blue-600" />
        </div>
        <p class="text-2xl font-bold text-blue-600">{stats.thisMonthHours.toFixed(1)}h</p>
        <p class="text-xs text-ink/60">{new Date().toLocaleDateString('de-AT', { month: 'long' })}</p>
      </div>
      
      <div class="bg-purple-50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm text-ink/60">Ø pro Tag</span>
          <TrendUp size={16} class="text-purple-600" />
        </div>
        <p class="text-2xl font-bold text-purple-600">{stats.dailyAverage.toFixed(1)}h</p>
        <p class="text-xs text-ink/60">Durchschnitt</p>
      </div>
    </div>
    
    <!-- Recent Entries -->
    {#if recentEntries.length > 0}
      <div>
        <h3 class="text-sm font-medium text-ink/60 mb-3">Letzte Einträge</h3>
        <div class="space-y-2">
          {#each recentEntries as entry}
            <div class="flex items-center justify-between py-2 border-b border-ink/5 last:border-0">
              <div class="flex-1">
                <p class="text-sm font-medium">{entry.date ? formatDate(entry.date) : 'Invalid date'}</p>
                {#if entry.description}
                  <p class="text-xs text-ink/60 truncate">{entry.description}</p>
                {/if}
              </div>
              <span class="text-sm font-medium">{((entry.duration_minutes || 0) / 60).toFixed(1)}h</span>
            </div>
          {/each}
        </div>
        
        <a 
          href="/zeiterfassung?project={projectId}"
          class="mt-4 inline-flex items-center gap-2 text-sm text-accent-green hover:text-accent-green/80"
        >
          Alle Zeiteinträge anzeigen →
        </a>
      </div>
    {/if}
    
    <!-- Comparison with last month -->
    {#if stats.lastMonthHours > 0}
      <div class="mt-4 p-3 bg-ink/5 rounded-lg">
        <p class="text-sm">
          <span class="text-ink/60">Letzter Monat:</span>
          <span class="font-medium ml-1">{stats.lastMonthHours.toFixed(1)}h</span>
          {#if stats.thisMonthHours > stats.lastMonthHours}
            <span class="text-green-600 ml-2">
              ↑ {((stats.thisMonthHours - stats.lastMonthHours) / stats.lastMonthHours * 100).toFixed(0)}%
            </span>
          {:else if stats.thisMonthHours < stats.lastMonthHours}
            <span class="text-red-600 ml-2">
              ↓ {((stats.lastMonthHours - stats.thisMonthHours) / stats.lastMonthHours * 100).toFixed(0)}%
            </span>
          {/if}
        </p>
      </div>
    {/if}
  {:else}
    <p class="text-ink/60 text-center py-8">Keine Zeiteinträge vorhanden</p>
  {/if}
</div>

<!-- PDF Generator -->
{#if showPDFExport && pdfExportParams}
  <TimeExportPDF
    start={pdfExportParams.start}
    end={pdfExportParams.end}
    projectId={projectId}
    onClose={() => {
      showPDFExport = false;
      pdfExportParams = null;
    }}
  />
{/if}