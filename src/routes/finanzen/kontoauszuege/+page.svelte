<script lang="ts">
  import { onMount } from 'svelte';
  import { Bank, Upload, FileText, MagnifyingGlass, Calendar, ArrowRight, X } from 'phosphor-svelte';
  
  let bankStatements: any[] = [];
  let transactions: any[] = [];
  let loading = false;
  let error = '';
  let selectedFile: File | null = null;
  let analyzing = false;
  let analysisProgress = 0;
  let analysisStep = '';
  let searchQuery = '';
  let selectedStatement: any = null;
  
  async function loadBankStatements() {
    loading = true;
    error = '';
    try {
      const response = await fetch('/api/bank-statements');
      if (!response.ok) {
        console.error('Failed to load bank statements:', response.status);
        bankStatements = [];
        return;
      }
      bankStatements = await response.json();
    } catch (err) {
      console.error('Error loading bank statements:', err);
      error = err instanceof Error ? err.message : 'Fehler beim Laden';
      bankStatements = [];
    } finally {
      loading = false;
    }
  }
  
  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      selectedFile = input.files[0];
    }
  }
  
  async function analyzeBankStatement() {
    if (!selectedFile) return;
    
    analyzing = true;
    analysisProgress = 0;
    analysisStep = 'Kontoauszug wird vorbereitet...';
    
    try {
      analysisProgress = 10;
      analysisStep = 'PDF wird hochgeladen...';
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      analysisProgress = 30;
      analysisStep = 'Datei wird an KI gesendet...';
      
      const response = await fetch('/api/bank-statements/upload', {
        method: 'POST',
        body: formData
      });
      
      analysisProgress = 60;
      analysisStep = 'Transaktionen werden analysiert...';
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analyse fehlgeschlagen');
      }
      
      analysisProgress = 85;
      analysisStep = 'Ergebnisse werden verarbeitet...';
      
      const result = await response.json();
      console.log('Analysis result:', result);
      
      analysisProgress = 95;
      analysisStep = 'Daten werden gespeichert...';
      
      await loadBankStatements();
      
      analysisProgress = 100;
      analysisStep = 'Analyse abgeschlossen!';
      
      selectedFile = null;
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      setTimeout(() => {
        alert('Kontoauszug wurde erfolgreich analysiert!');
      }, 500);
    } catch (err) {
      alert('Fehler bei der Analyse: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setTimeout(() => {
        analyzing = false;
        analysisProgress = 0;
        analysisStep = '';
      }, 1000);
    }
  }
  
  function formatCurrency(amount: number, currency: string = 'EUR') {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-AT');
  }
  
  onMount(() => {
    loadBankStatements();
  });
</script>

<div class="container mx-auto p-4">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-3xl font-bold flex items-center gap-3">
      <Bank size={32} />
      Kontoauszüge
    </h1>
  </div>
  
  <!-- Upload Section -->
  <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6 mb-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <Upload size={24} />
      Kontoauszug importieren
    </h3>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-ink mb-2">
          PDF-Datei auswählen
        </label>
        <input
          type="file"
          accept=".pdf,image/*"
          on:change={handleFileSelect}
          class="w-full px-3 py-2 border border-ink/20 rounded-md"
        />
      </div>
      
      {#if selectedFile}
        <div class="flex items-center justify-between p-3 bg-ink/5 rounded-lg">
          <span class="text-sm">{selectedFile.name}</span>
          <button
            on:click={() => selectedFile = null}
            class="text-red-600 hover:text-red-700"
          >
            <X size={18} />
          </button>
        </div>
      {/if}
      
      <button
        on:click={analyzeBankStatement}
        disabled={!selectedFile || analyzing}
        class="w-full px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 disabled:bg-ink/30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {#if analyzing}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Wird analysiert...
        {:else}
          <Upload size={20} />
          Importieren & Analysieren
        {/if}
      </button>
      
      <!-- Progress Bar -->
      {#if analyzing && analysisStep}
        <div class="mt-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-ink/70">{analysisStep}</span>
            <span class="text-ink/70">{analysisProgress}%</span>
          </div>
          <div class="w-full bg-ink/10 rounded-full h-2">
            <div 
              class="bg-accent-green h-2 rounded-full transition-all duration-300"
              style="width: {analysisProgress}%"
            ></div>
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Analysis Progress (Global) -->
  {#if analyzing && analysisStep}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span class="font-medium text-blue-900">Kontoauszug-Analyse läuft...</span>
      </div>
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-blue-700">{analysisStep}</span>
          <span class="text-blue-700">{analysisProgress}%</span>
        </div>
        <div class="w-full bg-blue-200 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style="width: {analysisProgress}%"
          ></div>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Search -->
  <div class="mb-6">
    <div class="relative">
      <MagnifyingGlass size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Transaktionen durchsuchen..."
        class="w-full pl-10 pr-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
      />
    </div>
  </div>
  
  <!-- Bank Statements List -->
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
    </div>
  {:else if bankStatements.length === 0}
    <div class="bg-ink/5 rounded-lg p-8 text-center">
      <Bank size={48} class="mx-auto text-ink/30 mb-4" />
      <h3 class="text-lg font-medium text-ink mb-2">Noch keine Kontoauszüge vorhanden</h3>
      <p class="text-ink/60 mb-4">
        {error ? 'Die Kontoauszug-Funktion ist noch nicht eingerichtet.' : 'Laden Sie einen PDF-Kontoauszug hoch, um zu beginnen.'}
      </p>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 overflow-hidden">
      <table class="w-full">
        <thead class="bg-ink/5 text-sm">
          <tr>
            <th class="text-left px-4 py-3">Zeitraum</th>
            <th class="text-left px-4 py-3">Bank</th>
            <th class="text-center px-4 py-3">Transaktionen</th>
            <th class="text-right px-4 py-3">Saldo</th>
            <th class="text-right px-4 py-3">Aktionen</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink/10">
          {#each bankStatements as statement}
            <tr class="hover:bg-ink/5 transition-colors">
              <td class="px-4 py-3">
                {formatDate(statement.start_date)} - {formatDate(statement.end_date)}
              </td>
              <td class="px-4 py-3">{statement.bank_name || 'Unbekannt'}</td>
              <td class="px-4 py-3 text-center">{statement.transaction_count || 0}</td>
              <td class="px-4 py-3 text-right font-mono">
                {formatCurrency(statement.ending_balance || 0)}
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  on:click={() => selectedStatement = statement}
                  class="text-accent-green hover:text-accent-green/80"
                >
                  Details →
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>