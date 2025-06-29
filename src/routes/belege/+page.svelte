<script lang="ts">
  import { onMount } from 'svelte';
  import { Receipt, Upload, Camera, MagnifyingGlass, Download, Eye, Trash, FolderOpen, X, Sparkle, Calendar, Folder, CaretRight, Pencil, ArrowsClockwise, Check } from 'phosphor-svelte';
  import type { Receipt as ReceiptType } from '$lib/server/supabase';
  
  let receipts: ReceiptType[] = [];
  let driveFiles: any[] = [];
  let driveFolders: any[] = [];
  let loading = true;
  let error = '';
  let uploading = false;
  let analyzing = false;
  let analysisProgress = 0;
  let analysisStep = '';
  let searchQuery = '';
  let selectedFile: File | null = null;
  let receiptsFolderId = '';
  let currentFolderId = '';
  let folderPath: { id: string; name: string }[] = [];
  let showPreview = false;
  let previewReceipt: ReceiptType | null = null;
  let activeTab: 'table' | 'drive' = 'table';
  let isAuthenticated = false;
  let settingsFolderId = '';
  let editingReceipt: ReceiptType | null = null;
  let editForm = {
    vendor: '',
    invoice_number: '',
    invoice_date: '',
    amount: 0,
    currency: 'EUR',
    category: '',
    payment_date: ''
  };
  
  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/google/status');
      if (response.ok) {
        const data = await response.json();
        isAuthenticated = data.authenticated;
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    }
  }
  
  async function loadSettings() {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const settings = await response.json();
        settingsFolderId = settings.drive_folders.receipts;
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }
  
  async function loadReceipts() {
    loading = true;
    error = '';
    
    try {
      // Load receipts from database
      const response = await fetch('/api/receipts/list');
      if (!response.ok) throw new Error('Failed to load receipts');
      receipts = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
  
  async function loadDriveFiles(folderId?: string) {
    try {
      // Use provided folder ID or default to settings folder
      const targetFolderId = folderId || settingsFolderId;
      
      // Don't try to load if we don't have a folder ID
      if (!targetFolderId) {
        console.log('No folder ID available, skipping drive files load');
        return;
      }
      
      if (!folderId) {
        receiptsFolderId = settingsFolderId;
        currentFolderId = settingsFolderId;
        folderPath = [{ id: settingsFolderId, name: 'Belege' }];
      }
      
      // Load both files and folders
      const response = await fetch(`/api/receipts/folder?folderId=${targetFolderId}`);
      if (!response.ok) {
        if (response.status === 401) {
          error = 'Nicht mit Google Drive verbunden';
          isAuthenticated = false;
          return;
        }
        throw new Error('Failed to load drive files');
      }
      
      const data = await response.json();
      driveFiles = data.files || [];
      driveFolders = data.folders || [];
      currentFolderId = targetFolderId;
    } catch (err) {
      console.error('Error loading drive files:', err);
      error = 'Fehler beim Laden der Drive-Dateien';
    }
  }
  
  async function navigateToFolder(folder: { id: string; name: string }) {
    const index = folderPath.findIndex(f => f.id === folder.id);
    if (index >= 0) {
      // Navigate back
      folderPath = folderPath.slice(0, index + 1);
    } else {
      // Navigate forward
      folderPath = [...folderPath, folder];
    }
    await loadDriveFiles(folder.id);
  }
  
  
  async function analyzeReceipt(fileId: string, filename: string) {
    analyzing = true;
    analysisProgress = 0;
    analysisStep = 'Datei wird vorbereitet...';
    
    try {
      // Simulate progress steps
      analysisProgress = 10;
      analysisStep = 'Datei wird an KI gesendet...';
      
      const response = await fetch('/api/receipts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId })
      });
      
      analysisProgress = 60;
      analysisStep = 'Beleg wird analysiert...';
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Analysis error:', error);
        throw new Error(error.details || error.error || 'Failed to analyze receipt');
      }
      
      analysisProgress = 90;
      analysisStep = 'Ergebnisse werden gespeichert...';
      
      const result = await response.json();
      await loadReceipts(); // Reload to show new receipt
      
      analysisProgress = 100;
      analysisStep = 'Abgeschlossen!';
      
      // Show completion briefly
      setTimeout(() => {
        alert(`Beleg "${filename}" wurde erfolgreich analysiert!`);
      }, 500);
    } catch (err) {
      console.error('Receipt analysis error:', err);
      alert('Fehler bei der Analyse: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setTimeout(() => {
        analyzing = false;
        analysisProgress = 0;
        analysisStep = '';
      }, 1000);
    }
  }
  
  async function uploadReceipt() {
    if (!selectedFile) {
      console.error('No file selected');
      return;
    }
    
    console.log('Starting upload...', selectedFile.name);
    uploading = true;
    analysisProgress = 0;
    analysisStep = 'Datei wird hochgeladen...';
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      // Upload to settings folder
      formData.append('folderId', settingsFolderId);
      
      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData
      });
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const uploadedFile = await response.json();
      console.log('Upload successful:', uploadedFile);
      
      analysisStep = 'Upload abgeschlossen, starte Analyse...';
      
      // Automatically analyze after upload
      await analyzeReceipt(uploadedFile.id, uploadedFile.name);
      
      // Clear selected file
      selectedFile = null;
      
      // Reload drive files
      await loadDriveFiles();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Fehler beim Upload: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      uploading = false;
    }
  }
  
  async function deleteReceipt(receiptId: string) {
    if (!confirm('Möchten Sie diesen Beleg wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete receipt');
      
      await loadReceipts();
    } catch (err) {
      alert('Fehler beim Löschen: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }
  
  function startEditingReceipt(receipt: ReceiptType) {
    editingReceipt = receipt;
    editForm = {
      vendor: receipt.vendor || '',
      invoice_number: receipt.invoice_number || '',
      invoice_date: receipt.invoice_date || '',
      amount: receipt.amount || 0,
      currency: receipt.currency || 'EUR',
      category: receipt.category || '',
      payment_date: receipt.payment_date || ''
    };
  }
  
  async function saveReceiptEdits() {
    if (!editingReceipt) return;
    
    try {
      const response = await fetch(`/api/receipts/${editingReceipt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) throw new Error('Failed to update receipt');
      
      await loadReceipts();
      editingReceipt = null;
    } catch (err) {
      alert('Fehler beim Speichern: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }
  
  async function reanalyzeReceipt(receipt: ReceiptType) {
    if (!receipt.drive_file_id) {
      alert('Kein Drive-File für diesen Beleg vorhanden');
      return;
    }
    
    if (!confirm('Möchten Sie diesen Beleg erneut analysieren lassen?')) return;
    
    analyzing = true;
    analysisProgress = 0;
    analysisStep = 'Neu-Analyse wird vorbereitet...';
    
    try {
      analysisProgress = 20;
      analysisStep = 'Beleg wird neu an KI gesendet...';
      
      const response = await fetch('/api/receipts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId: receipt.drive_file_id,
          receiptId: receipt.id // Pass existing receipt ID for update
        })
      });
      
      analysisProgress = 70;
      analysisStep = 'Neue Analyse läuft...';
      
      if (!response.ok) throw new Error('Failed to re-analyze receipt');
      
      analysisProgress = 90;
      analysisStep = 'Aktualisierte Daten werden gespeichert...';
      
      await loadReceipts();
      
      analysisProgress = 100;
      analysisStep = 'Neu-Analyse abgeschlossen!';
      
      setTimeout(() => {
        alert('Beleg wurde erfolgreich neu analysiert!');
      }, 500);
    } catch (err) {
      alert('Fehler bei der Analyse: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setTimeout(() => {
        analyzing = false;
        analysisProgress = 0;
        analysisStep = '';
      }, 1000);
    }
  }
  
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      selectedFile = input.files[0];
    }
  }
  
  function formatCurrency(amount: number, currency: string = 'EUR') {
    // Ensure currency is a valid ISO code
    const validCurrency = (!currency || currency === '€' || currency.length !== 3) ? 'EUR' : currency;
    
    try {
      return new Intl.NumberFormat('de-AT', {
        style: 'currency',
        currency: validCurrency
      }).format(amount);
    } catch (error) {
      // Fallback formatting if currency code is still invalid
      console.error('Invalid currency:', currency, error);
      return `${validCurrency} ${amount.toFixed(2)}`;
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-AT');
  }
  
  $: filteredReceipts = receipts.filter(receipt => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      receipt.vendor?.toLowerCase().includes(search) ||
      receipt.invoice_number?.toLowerCase().includes(search) ||
      receipt.description?.toLowerCase().includes(search)
    );
  });
  
  onMount(async () => {
    await checkAuth();
    await loadSettings();
    await loadReceipts();
    // Set default receipts folder ID from settings
    receiptsFolderId = settingsFolderId;
    if (activeTab === 'drive') {
      await loadDriveFiles();
    }
  });
  
  $: if (activeTab === 'drive' && receipts.length > 0) {
    loadDriveFiles();
  }
</script>

<div class="container mx-auto p-4">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-3xl font-bold flex items-center gap-3">
      <Receipt size={32} />
      Belege
    </h1>
    
    {#if !isAuthenticated}
      <a 
        href="/api/auth/google?action=login"
        class="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90"
      >
        Mit Google anmelden
      </a>
    {/if}
  </div>
  
  <!-- Tabs -->
  <div class="flex gap-2 mb-6">
    <button
      on:click={() => activeTab = 'table'}
      class={`px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === 'table' 
          ? 'bg-accent-green text-white' 
          : 'bg-ink/10 text-ink/60 hover:bg-ink/20'
      }`}
    >
      Belege-Übersicht
    </button>
    <button
      on:click={() => activeTab = 'drive'}
      class={`px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === 'drive' 
          ? 'bg-accent-green text-white' 
          : 'bg-ink/10 text-ink/60 hover:bg-ink/20'
      }`}
    >
      Drive Upload
    </button>
  </div>
  
  {#if error && !isAuthenticated}
    <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <p class="text-amber-800">
        Um Belege hochzuladen und zu verwalten, müssen Sie sich zuerst mit Google anmelden.
      </p>
    </div>
  {/if}
  
  {#if activeTab === 'table'}
    <!-- Search -->
    <div class="mb-6">
      <div class="relative">
        <MagnifyingGlass size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Belege durchsuchen..."
          class="w-full pl-10 pr-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
        />
      </div>
    </div>
    
    <!-- Receipts Table -->
    {#if loading}
      <div class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
      </div>
    {:else if filteredReceipts.length === 0}
      <div class="text-center py-12">
        <Receipt size={48} class="mx-auto text-ink/30 mb-4" />
        <p class="text-ink/60">Keine Belege gefunden</p>
      </div>
    {:else}
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 overflow-hidden">
        <table class="w-full">
          <thead class="bg-ink/5 text-sm">
            <tr>
              <th class="text-left px-4 py-3">Datum</th>
              <th class="text-left px-4 py-3">Lieferant</th>
              <th class="text-left px-4 py-3">Belegnummer</th>
              <th class="text-right px-4 py-3">Betrag</th>
              <th class="text-center px-4 py-3">Status</th>
              <th class="text-right px-4 py-3">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink/10">
            {#each filteredReceipts as receipt}
              <tr class="hover:bg-ink/5 transition-colors">
                <td class="px-4 py-3">{formatDate(receipt.invoice_date || receipt.created_at)}</td>
                <td class="px-4 py-3">{receipt.vendor || 'Unbekannt'}</td>
                <td class="px-4 py-3 text-sm text-ink/60">{receipt.invoice_number || '-'}</td>
                <td class="px-4 py-3 text-right font-mono">
                  {formatCurrency(receipt.amount || 0, receipt.currency || 'EUR')}
                </td>
                <td class="px-4 py-3 text-center">
                  <span class={`inline-flex px-2 py-1 text-xs rounded-full ${
                    receipt.payment_date 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {receipt.payment_date ? 'Bezahlt' : 'Offen'}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      on:click={() => {
                        previewReceipt = receipt;
                        showPreview = true;
                      }}
                      class="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Vorschau"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      on:click={() => startEditingReceipt(receipt)}
                      class="p-1 text-amber-600 hover:bg-amber-50 rounded"
                      title="Bearbeiten"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      on:click={() => reanalyzeReceipt(receipt)}
                      disabled={analyzing}
                      class="p-1 text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50"
                      title="Neu analysieren"
                    >
                      <ArrowsClockwise size={18} />
                    </button>
                    {#if receipt.file_url}
                      <a
                        href={receipt.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Download"
                      >
                        <Download size={18} />
                      </a>
                    {/if}
                    <button
                      on:click={() => deleteReceipt(receipt.id)}
                      class="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Löschen"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {:else}
    <!-- Drive Upload Tab -->
    <div class="space-y-6">
      <!-- Upload Section -->
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload size={24} />
          Beleg hochladen
        </h3>
        
        <p class="text-sm text-ink/60 mb-4">
          Neue Belege werden automatisch in den Eingangsordner hochgeladen und können später sortiert werden.
        </p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-ink mb-2">
              Datei auswählen
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              on:change={handleFileSelect}
              class="w-full px-3 py-2 border border-ink/20 rounded-md"
              disabled={!isAuthenticated}
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
            on:click={uploadReceipt}
            disabled={!selectedFile || uploading || analyzing || !isAuthenticated}
            class="w-full px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 disabled:bg-ink/30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {#if uploading || analyzing}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {uploading ? 'Wird hochgeladen...' : 'Wird analysiert...'}
            {:else}
              <Upload size={20} />
              Hochladen & Analysieren
            {/if}
          </button>
          
          <!-- Progress Bar -->
          {#if (uploading || analyzing) && analysisStep}
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
            <span class="font-medium text-blue-900">Analyse läuft...</span>
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
      
      <!-- Drive Files -->
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2 flex items-center gap-2">
            <FolderOpen size={24} />
            Belege in Google Drive
          </h3>
          
          <!-- Breadcrumb Navigation -->
          {#if folderPath.length > 0}
            <div class="flex items-center gap-2 text-sm">
              {#each folderPath as folder, i}
                <button
                  on:click={() => navigateToFolder(folder)}
                  class="text-ink/60 hover:text-accent-green transition-colors"
                >
                  {folder.name}
                </button>
                {#if i < folderPath.length - 1}
                  <CaretRight size={14} class="text-ink/40" />
                {/if}
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Folders -->
        {#if driveFolders.length > 0}
          <div class="mb-4">
            <p class="text-sm font-medium text-ink/60 mb-2">Ordner</p>
            <div class="space-y-2">
              {#each driveFolders as folder}
                <button
                  on:click={() => navigateToFolder(folder)}
                  class="w-full flex items-center gap-3 p-3 border border-ink/10 rounded-lg hover:bg-ink/5 transition-colors text-left"
                >
                  <Folder size={20} class="text-amber-600" />
                  <span class="font-medium">{folder.name}</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Files -->
        {#if driveFiles.length === 0 && driveFolders.length === 0}
          <p class="text-ink/60">Dieser Ordner ist leer</p>
        {:else if driveFiles.length > 0}
          <div>
            <p class="text-sm font-medium text-ink/60 mb-2">Dateien</p>
          <div class="space-y-2">
            {#each driveFiles as file}
              <div class="flex items-center justify-between p-3 border border-ink/10 rounded-lg hover:bg-ink/5">
                <div class="flex items-center gap-3">
                  <Receipt size={20} class="text-ink/60" />
                  <div>
                    <p class="font-medium">{file.name}</p>
                    <p class="text-sm text-ink/60">
                      {new Date(file.createdTime).toLocaleDateString('de-AT')}
                    </p>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <button
                    on:click={() => analyzeReceipt(file.id, file.name)}
                    disabled={analyzing}
                    class="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-ink/30 flex items-center gap-2 text-sm"
                  >
                    {#if analyzing}
                      <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    {:else}
                      <Sparkle size={16} />
                    {/if}
                    Analysieren
                  </button>
                </div>
              </div>
            {/each}
          </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Receipt Preview Modal -->
{#if showPreview && previewReceipt}
  <div class="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-xl font-bold">Beleg-Details</h2>
        <button
          on:click={() => {
            showPreview = false;
            previewReceipt = null;
          }}
          class="p-1 hover:bg-ink/10 rounded"
        >
          <X size={24} />
        </button>
      </div>
      
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-ink/60">Lieferant</p>
            <p class="font-medium">{previewReceipt.vendor || 'Unbekannt'}</p>
          </div>
          <div>
            <p class="text-sm text-ink/60">Belegnummer</p>
            <p class="font-medium">{previewReceipt.invoice_number || '-'}</p>
          </div>
          <div>
            <p class="text-sm text-ink/60">Datum</p>
            <p class="font-medium">{formatDate(previewReceipt.invoice_date || previewReceipt.created_at)}</p>
          </div>
          <div>
            <p class="text-sm text-ink/60">Betrag</p>
            <p class="font-medium">{formatCurrency(previewReceipt.amount || 0, previewReceipt.currency || 'EUR')}</p>
          </div>
        </div>
        
        {#if previewReceipt.category}
          <div>
            <p class="text-sm text-ink/60">Kategorie</p>
            <p>{previewReceipt.category}</p>
          </div>
        {/if}
        
        {#if previewReceipt.items && previewReceipt.items.length > 0}
          <div>
            <p class="text-sm text-ink/60 mb-2">Positionen</p>
            <div class="border border-ink/10 rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-ink/5">
                  <tr>
                    <th class="text-left px-3 py-2">Beschreibung</th>
                    <th class="text-right px-3 py-2">Menge</th>
                    <th class="text-right px-3 py-2">Preis</th>
                    <th class="text-right px-3 py-2">Gesamt</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-ink/10">
                  {#each previewReceipt.items as item}
                    <tr>
                      <td class="px-3 py-2">{item.description}</td>
                      <td class="px-3 py-2 text-right">{item.quantity}</td>
                      <td class="px-3 py-2 text-right">{formatCurrency(item.unitPrice || 0, previewReceipt.currency || 'EUR')}</td>
                      <td class="px-3 py-2 text-right">{formatCurrency(item.totalPrice || 0, previewReceipt.currency || 'EUR')}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Edit Receipt Modal -->
{#if editingReceipt}
  <div class="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-xl font-bold">Beleg bearbeiten</h2>
        <button
          on:click={() => editingReceipt = null}
          class="p-1 hover:bg-ink/10 rounded"
        >
          <X size={24} />
        </button>
      </div>
      
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-ink mb-2">
              Lieferant
            </label>
            <input
              type="text"
              bind:value={editForm.vendor}
              class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-ink mb-2">
              Belegnummer
            </label>
            <input
              type="text"
              bind:value={editForm.invoice_number}
              class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-ink mb-2">
              Belegdatum
            </label>
            <input
              type="date"
              bind:value={editForm.invoice_date}
              class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-ink mb-2">
              Zahlungsdatum
            </label>
            <input
              type="date"
              bind:value={editForm.payment_date}
              class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-ink mb-2">
              Betrag
            </label>
            <input
              type="number"
              step="0.01"
              bind:value={editForm.amount}
              class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-ink mb-2">
              Währung
            </label>
            <select
              bind:value={editForm.currency}
              class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
          
          <div class="col-span-2">
            <label class="block text-sm font-medium text-ink mb-2">
              Kategorie
            </label>
            <input
              type="text"
              bind:value={editForm.category}
              placeholder="z.B. Büromaterial, Reisekosten, etc."
              class="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            />
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button
            on:click={() => editingReceipt = null}
            class="px-4 py-2 bg-ink/10 text-ink rounded-lg hover:bg-ink/20"
          >
            Abbrechen
          </button>
          <button
            on:click={saveReceiptEdits}
            class="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 flex items-center gap-2"
          >
            <Check size={20} />
            Speichern
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

