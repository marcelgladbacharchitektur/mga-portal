<script lang="ts">
  import { onMount } from 'svelte';
  import { Calendar, Clock, TrendUp, TrendDown, CaretLeft, CaretRight, Download } from 'phosphor-svelte';
  import TimeExportPDF from '$lib/components/TimeExportPDFSimple.svelte';
  
  interface TimeEntry {
    id: string;
    project_id: string;
    project_name: string;
    date: string;
    duration_minutes: number;
    description?: string;
  }
  
  interface WeekSummary {
    weekNumber: number;
    startDate: Date;
    endDate: Date;
    totalHours: number;
    projectHours: Record<string, { name: string; hours: number }>;
    dailyHours: Record<string, number>;
  }
  
  interface MonthSummary {
    month: number;
    year: number;
    totalHours: number;
    projectHours: Record<string, { name: string; hours: number }>;
    weeklyHours: Record<number, number>;
  }
  
  let currentDate = new Date();
  let viewMode: 'week' | 'month' = 'week';
  let weekSummary: WeekSummary | null = null;
  let monthSummary: MonthSummary | null = null;
  let loading = true;
  let error = '';
  let showPDFExport = false;
  let pdfExportParams: { start: string; end: string } | null = null;
  
  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  }
  
  function getWeekRange(date: Date): { start: Date, end: Date } {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    const start = new Date(d);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  
  function getMonthRange(date: Date): { start: Date, end: Date } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }
  
  async function loadTimeEntries(startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    const response = await fetch(`/api/time-entries?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
    if (!response.ok) throw new Error('Failed to load time entries');
    return await response.json();
  }
  
  async function loadWeekSummary() {
    try {
      const { start, end } = getWeekRange(currentDate);
      const entries = await loadTimeEntries(start, end);
      
      const projectHours: Record<string, { name: string; hours: number }> = {};
      const dailyHours: Record<string, number> = {};
      
      // Initialize daily hours for the week
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        dailyHours[day.toISOString().split('T')[0]] = 0;
      }
      
      entries.forEach(entry => {
        // Sum by project
        if (!projectHours[entry.project_id]) {
          projectHours[entry.project_id] = { name: entry.project_name, hours: 0 };
        }
        projectHours[entry.project_id].hours += ((entry.duration_minutes || 0) / 60);
        
        // Sum by day
        const dateKey = entry.date.split('T')[0];
        dailyHours[dateKey] += ((entry.duration_minutes || 0) / 60);
      });
      
      weekSummary = {
        weekNumber: getWeekNumber(currentDate),
        startDate: start,
        endDate: end,
        totalHours: entries.reduce((sum, e) => sum + ((e.duration_minutes || 0) / 60), 0),
        projectHours,
        dailyHours
      };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
  }
  
  async function loadMonthSummary() {
    try {
      const { start, end } = getMonthRange(currentDate);
      const entries = await loadTimeEntries(start, end);
      
      const projectHours: Record<string, { name: string; hours: number }> = {};
      const weeklyHours: Record<number, number> = {};
      
      entries.forEach(entry => {
        // Sum by project
        if (!projectHours[entry.project_id]) {
          projectHours[entry.project_id] = { name: entry.project_name, hours: 0 };
        }
        projectHours[entry.project_id].hours += ((entry.duration_minutes || 0) / 60);
        
        // Sum by week
        const weekNum = getWeekNumber(new Date(entry.date));
        weeklyHours[weekNum] = (weeklyHours[weekNum] || 0) + ((entry.duration_minutes || 0) / 60);
      });
      
      monthSummary = {
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        totalHours: entries.reduce((sum, e) => sum + ((e.duration_minutes || 0) / 60), 0),
        projectHours,
        weeklyHours
      };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
  }
  
  async function loadData() {
    loading = true;
    error = '';
    
    if (viewMode === 'week') {
      await loadWeekSummary();
    } else {
      await loadMonthSummary();
    }
    
    loading = false;
  }
  
  function navigate(direction: -1 | 1) {
    if (viewMode === 'week') {
      currentDate.setDate(currentDate.getDate() + (direction * 7));
    } else {
      currentDate.setMonth(currentDate.getMonth() + direction);
    }
    currentDate = new Date(currentDate);
    loadData();
  }
  
  function goToToday() {
    currentDate = new Date();
    loadData();
  }
  
  function switchView(mode: 'week' | 'month') {
    viewMode = mode;
    loadData();
  }
  
  function formatDateRange(start: Date, end: Date): string {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
    return `${start.toLocaleDateString('de-AT', options)} - ${end.toLocaleDateString('de-AT', options)}`;
  }
  
  function getDayName(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-AT', { weekday: 'short' });
  }
  
  function getWeekDays(start: Date): string[] {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day.toISOString().split('T')[0]);
    }
    return days;
  }
  
  function getWeekdayColor(hours: number): string {
    if (hours === 0) return 'bg-gray-100';
    if (hours < 4) return 'bg-yellow-100';
    if (hours <= 8) return 'bg-green-100';
    return 'bg-orange-100';
  }
  
  onMount(() => {
    loadData();
  });
</script>

<div class="container mx-auto p-4 max-w-6xl">
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-4">Zeitübersicht</h1>
    
    <!-- View Mode Switcher -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex gap-2">
        <button
          on:click={() => switchView('week')}
          class={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'week' ? 'bg-accent-green text-white' : 'bg-ink/10 text-ink/60 hover:bg-ink/20'
          }`}
        >
          Wochenansicht
        </button>
        <button
          on:click={() => switchView('month')}
          class={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'month' ? 'bg-accent-green text-white' : 'bg-ink/10 text-ink/60 hover:bg-ink/20'
          }`}
        >
          Monatsansicht
        </button>
      </div>
      
      <div class="flex gap-2">
        <button
          on:click={() => {
            const now = new Date();
            const start = viewMode === 'week' 
              ? getWeekRange(currentDate).start.toISOString().split('T')[0]
              : new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const end = viewMode === 'week'
              ? getWeekRange(currentDate).end.toISOString().split('T')[0]
              : new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            pdfExportParams = { start, end };
            showPDFExport = true;
          }}
          class="flex items-center gap-2 px-4 py-2 bg-white border border-ink/20 rounded-lg hover:bg-ink/5 font-medium"
        >
          <Download size={16} />
          <span>Export</span>
        </button>
        
        <button
          on:click={goToToday}
          class="px-4 py-2 bg-ink/10 text-ink/80 rounded-lg hover:bg-ink/20 font-medium"
        >
          Heute
        </button>
      </div>
    </div>
    
    <!-- Navigation -->
    <div class="flex items-center justify-between bg-white rounded-lg shadow-sm border border-ink/10 p-4">
      <button
        on:click={() => navigate(-1)}
        class="p-2 hover:bg-ink/5 rounded-lg transition-colors"
      >
        <CaretLeft size={20} />
      </button>
      
      <h2 class="text-lg font-semibold">
        {#if viewMode === 'week' && weekSummary}
          KW {weekSummary.weekNumber} - {formatDateRange(weekSummary.startDate, weekSummary.endDate)}
        {:else if viewMode === 'month' && monthSummary}
          {new Date(monthSummary.year, monthSummary.month).toLocaleDateString('de-AT', { month: 'long', year: 'numeric' })}
        {/if}
      </h2>
      
      <button
        on:click={() => navigate(1)}
        class="p-2 hover:bg-ink/5 rounded-lg transition-colors"
      >
        <CaretRight size={20} />
      </button>
    </div>
  </div>
  
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
    </div>
  {:else if error}
    <div class="bg-red-100/50 border border-red-400/50 text-red-700 px-4 py-3 rounded">
      {error}
    </div>
  {:else if viewMode === 'week' && weekSummary}
    <!-- Week View -->
    <div class="grid gap-6">
      <!-- Total Hours Card -->
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold mb-1">Gesamtstunden</h3>
            <p class="text-3xl font-bold text-accent-green">{weekSummary.totalHours.toFixed(1)}h</p>
          </div>
          <Clock size={48} class="text-ink/20" />
        </div>
      </div>
      
      <!-- Daily Overview -->
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <h3 class="text-lg font-semibold mb-4">Tagesübersicht</h3>
        <div class="grid grid-cols-7 gap-2">
          {#each getWeekDays(weekSummary.startDate) as date}
            {@const hours = weekSummary.dailyHours[date] || 0}
            <div class={`p-3 rounded-lg text-center ${getWeekdayColor(hours)}`}>
              <p class="text-sm font-medium text-ink/60">{getDayName(date)}</p>
              <p class="text-lg font-bold">{hours.toFixed(1)}h</p>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Projects -->
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <h3 class="text-lg font-semibold mb-4">Projekte</h3>
        {#if Object.keys(weekSummary.projectHours).length > 0}
          <div class="space-y-3">
            {#each Object.entries(weekSummary.projectHours) as [projectId, data]}
              <div class="flex items-center justify-between py-2 border-b border-ink/5 last:border-0">
                <a href="/projekte/{projectId}" class="text-ink hover:text-accent-green">
                  {data.name}
                </a>
                <span class="font-medium">{data.hours.toFixed(1)}h</span>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-ink/60">Keine Zeiteinträge für diese Woche</p>
        {/if}
      </div>
    </div>
  {:else if viewMode === 'month' && monthSummary}
    <!-- Month View -->
    <div class="grid gap-6">
      <!-- Total Hours Card -->
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold mb-1">Gesamtstunden</h3>
            <p class="text-3xl font-bold text-accent-green">{monthSummary.totalHours.toFixed(1)}h</p>
          </div>
          <Calendar size={48} class="text-ink/20" />
        </div>
      </div>
      
      <!-- Weekly Overview -->
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <h3 class="text-lg font-semibold mb-4">Wochenübersicht</h3>
        {#if Object.keys(monthSummary.weeklyHours).length > 0}
          <div class="space-y-2">
            {#each Object.entries(monthSummary.weeklyHours).sort((a, b) => Number(a[0]) - Number(b[0])) as [week, hours]}
              <div class="flex items-center justify-between py-2 border-b border-ink/5 last:border-0">
                <span class="text-ink/60">KW {week}</span>
                <span class="font-medium">{hours.toFixed(1)}h</span>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-ink/60">Keine Zeiteinträge für diesen Monat</p>
        {/if}
      </div>
      
      <!-- Projects -->
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <h3 class="text-lg font-semibold mb-4">Projekte</h3>
        {#if Object.keys(monthSummary.projectHours).length > 0}
          <div class="space-y-3">
            {#each Object.entries(monthSummary.projectHours).sort((a, b) => b[1].hours - a[1].hours) as [projectId, data]}
              <div class="flex items-center justify-between">
                <a href="/projekte/{projectId}" class="text-ink hover:text-accent-green">
                  {data.name}
                </a>
                <div class="flex items-center gap-3">
                  <div class="w-32 bg-gray-200 rounded-full h-2 relative">
                    <div 
                      class="bg-accent-green h-2 rounded-full"
                      style="width: {(data.hours / monthSummary.totalHours) * 100}%"
                    ></div>
                  </div>
                  <span class="font-medium w-16 text-right">{data.hours.toFixed(1)}h</span>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-ink/60">Keine Zeiteinträge für diesen Monat</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- PDF Generator -->
{#if showPDFExport && pdfExportParams}
  <TimeExportPDF
    start={pdfExportParams.start}
    end={pdfExportParams.end}
    projectId={null}
    onClose={() => {
      showPDFExport = false;
      pdfExportParams = null;
    }}
  />
{/if}