<script lang="ts">
  import { onMount } from 'svelte';
  import { Bank, Upload, FileText, MagnifyingGlass, Calendar, ArrowRight, X } from 'phosphor-svelte';
  
  let bankStatements: any[] = [];
  let transactions: any[] = [];
  let loading = false;
  let error = '';
  let selectedFile: File | null = null;
  let analyzing = false;
  let searchQuery = '';
  let selectedStatement: any = null;
  
  async function loadBankStatements() {
    loading = true;
    try {
      // TODO: Implement loading from API
      // const response = await fetch('/api/bank-statements');
      // bankStatements = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Fehler beim Laden';
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
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/bank-statements/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Analyse fehlgeschlagen');
      
      const result = await response.json();
      await loadBankStatements();
      
      selectedFile = null;
      alert('Kontoauszug wurde erfolgreich analysiert!');
    } catch (err) {
      alert('Fehler bei der Analyse: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      analyzing = false;
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
          accept=".pdf"
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
    </div>
  </div>
  
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
    <div class="text-center py-12 bg-white rounded-lg border border-ink/10">
      <Bank size={48} class="mx-auto text-ink/30 mb-4" />
      <p class="text-ink/60">Noch keine Kontoauszüge importiert</p>
      <p class="text-sm text-ink/40 mt-2">Laden Sie einen PDF-Kontoauszug hoch, um zu beginnen</p>
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