<script lang="ts">
  import { onMount } from 'svelte';
  import { Bank, Upload, FileText, MagnifyingGlass, Calendar, ArrowRight, X, Pencil, Trash, Eye } from 'phosphor-svelte';
  
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
  let editingStatement: any = null;
  let showStatementDetails = false;
  let editForm = {
    bank_name: '',
    account_number: '',
    iban: ''
  };
  let savingEdit = false;
  
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
  
  function viewStatementDetails(statement: any) {
    selectedStatement = statement;
    showStatementDetails = true;
  }
  
  function editStatement(statement: any) {
    editingStatement = statement;
    editForm = {
      bank_name: statement.bank_name || '',
      account_number: statement.account_number || '',
      iban: statement.iban || ''
    };
  }
  
  async function saveStatementEdit() {
    if (!editingStatement) return;
    
    savingEdit = true;
    try {
      const response = await fetch(`/api/bank-statements/${editingStatement.bank_account_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) throw new Error('Failed to update bank statement');
      
      await loadBankStatements();
      editingStatement = null;
    } catch (err) {
      alert('Fehler beim Speichern: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      savingEdit = false;
    }
  }
  
  function cancelEdit() {
    editingStatement = null;
  }
  
  async function deleteStatement(statement: any) {
    if (!confirm('Möchten Sie diesen Kontoauszug wirklich löschen?')) return;
    
    try {
      // Delete the bank account (which should cascade to transactions)
      const response = await fetch(`/api/bank-statements/${statement.bank_account_id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete bank statement');
      
      await loadBankStatements();
    } catch (err) {
      alert('Fehler beim Löschen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    }
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
    <!-- Bank Statements Grid View -->
    <div class="grid gap-4">
      {#each bankStatements as statement}
        <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <Bank size={24} class="text-ink/60" />
                <div>
                  <h3 class="font-semibold text-lg">{statement.bank_name || 'Unbekannte Bank'}</h3>
                  <p class="text-sm text-ink/60">
                    {#if statement.iban}
                      IBAN: {statement.iban}
                    {:else if statement.account_number}
                      Konto: {statement.account_number}
                    {:else}
                      Kein Konto angegeben
                    {/if}
                  </p>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div class="bg-blue-50 p-3 rounded-lg">
                  <div class="text-xs text-blue-600 mb-1">Zeitraum</div>
                  <div class="text-sm font-medium">
                    {#if statement.start_date && statement.end_date}
                      {formatDate(statement.start_date)} - {formatDate(statement.end_date)}
                    {:else}
                      Keine Daten
                    {/if}
                  </div>
                </div>
                
                <div class="bg-green-50 p-3 rounded-lg">
                  <div class="text-xs text-green-600 mb-1">Transaktionen</div>
                  <div class="text-lg font-bold text-green-700">{statement.transaction_count || 0}</div>
                </div>
                
                <div class="bg-amber-50 p-3 rounded-lg">
                  <div class="text-xs text-amber-600 mb-1">Umsatz</div>
                  <div class="text-sm font-mono">
                    <div class="text-red-600">-{formatCurrency(statement.total_debits || 0)}</div>
                    <div class="text-green-600">+{formatCurrency(statement.total_credits || 0)}</div>
                  </div>
                </div>
                
                <div class="bg-slate-50 p-3 rounded-lg">
                  <div class="text-xs text-slate-600 mb-1">Endsaldo</div>
                  <div class="text-lg font-bold font-mono {(statement.ending_balance || 0) >= 0 ? 'text-green-700' : 'text-red-700'}">
                    {formatCurrency(statement.ending_balance || 0)}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex gap-2 ml-4">
              <button
                on:click={() => viewStatementDetails(statement)}
                class="px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-2"
                title="Details anzeigen"
              >
                <Eye size={16} />
                Details
              </button>
              <button
                on:click={() => editStatement(statement)}
                class="px-3 py-2 text-sm bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-2"
                title="Bearbeiten"
              >
                <Pencil size={16} />
                Bearbeiten
              </button>
              <button
                on:click={() => deleteStatement(statement)}
                class="px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors flex items-center gap-2"
                title="Löschen"
              >
                <Trash size={16} />
                Löschen
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Statement Details Modal -->
{#if showStatementDetails && selectedStatement}
  <div class="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-xl font-bold">Kontoauszug Details</h2>
        <button
          on:click={() => {
            showStatementDetails = false;
            selectedStatement = null;
          }}
          class="p-1 hover:bg-ink/10 rounded"
        >
          <X size={24} />
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="font-semibold mb-2">Kontodetails</h3>
          <div class="space-y-2 text-sm">
            <div><span class="text-ink/60">Bank:</span> {selectedStatement.bank_name || 'Unbekannt'}</div>
            <div><span class="text-ink/60">Kontonummer:</span> {selectedStatement.account_number || '-'}</div>
            <div><span class="text-ink/60">IBAN:</span> {selectedStatement.iban || '-'}</div>
          </div>
        </div>
        
        <div>
          <h3 class="font-semibold mb-2">Zeitraum & Statistiken</h3>
          <div class="space-y-2 text-sm">
            <div><span class="text-ink/60">Von:</span> {selectedStatement.start_date ? formatDate(selectedStatement.start_date) : '-'}</div>
            <div><span class="text-ink/60">Bis:</span> {selectedStatement.end_date ? formatDate(selectedStatement.end_date) : '-'}</div>
            <div><span class="text-ink/60">Transaktionen:</span> {selectedStatement.transaction_count || 0}</div>
            <div><span class="text-ink/60">Endsaldo:</span> <span class="font-mono">{formatCurrency(selectedStatement.ending_balance || 0)}</span></div>
          </div>
        </div>
      </div>
      
      <div class="border-t pt-4">
        <h3 class="font-semibold mb-4">Zusammenfassung</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="text-sm text-red-600 mb-1">Ausgaben</div>
            <div class="text-lg font-semibold text-red-700">{formatCurrency(selectedStatement.total_debits || 0)}</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-sm text-green-600 mb-1">Einnahmen</div>
            <div class="text-lg font-semibold text-green-700">{formatCurrency(selectedStatement.total_credits || 0)}</div>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-blue-600 mb-1">Endsaldo</div>
            <div class="text-lg font-semibold text-blue-700">{formatCurrency(selectedStatement.ending_balance || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Statement Modal -->
{#if editingStatement}
  <div class="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-xl font-bold">Kontoauszug bearbeiten</h2>
        <button
          on:click={cancelEdit}
          class="p-1 hover:bg-ink/10 rounded"
        >
          <X size={24} />
        </button>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-ink mb-2">
            Bankname
          </label>
          <input
            type="text"
            bind:value={editForm.bank_name}
            class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-ink mb-2">
            Kontonummer
          </label>
          <input
            type="text"
            bind:value={editForm.account_number}
            class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50 font-mono"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-ink mb-2">
            IBAN
          </label>
          <input
            type="text"
            bind:value={editForm.iban}
            class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50 font-mono"
          />
        </div>
        
        <div class="flex justify-end gap-3 pt-4 border-t border-ink/10">
          <button
            on:click={cancelEdit}
            class="px-4 py-2 bg-ink/10 text-ink rounded-lg hover:bg-ink/20"
          >
            Abbrechen
          </button>
          <button
            on:click={saveStatementEdit}
            disabled={savingEdit}
            class="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 disabled:bg-ink/30 flex items-center gap-2"
          >
            {#if savingEdit}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            {/if}
            Speichern
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}