<script lang="ts">
  import { onMount } from 'svelte';
  import { Receipt, Upload, Camera, MagnifyingGlass, Download, Eye, Trash, FolderOpen, X, Sparkle, Calendar } from 'phosphor-svelte';
  import type { Receipt as ReceiptType } from '$lib/server/supabase';
  import { DRIVE_FOLDERS } from '$lib/config/drive-folders';
  
  let receipts: ReceiptType[] = [];
  let driveFiles: any[] = [];
  let loading = true;
  let error = '';
  let uploading = false;
  let analyzing = false;
  let searchQuery = '';
  let selectedFile: File | null = null;
  let receiptsFolderId = '';
  let showPreview = false;
  let previewReceipt: ReceiptType | null = null;
  let activeTab: 'table' | 'drive' = 'table';
  
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
  
  async function loadDriveFiles() {
    try {
      // Use the specific incoming receipts folder
      receiptsFolderId = DRIVE_FOLDERS.RECEIPTS_INBOX;
      
      // Load files from the incoming receipts folder
      const response = await fetch(`/api/receipts?folderId=${receiptsFolderId}`);
      if (!response.ok) {
        if (response.status === 401) {
          error = 'Nicht mit Google Drive verbunden';
          return;
        }
        throw new Error('Failed to load drive files');
      }
      
      const data = await response.json();
      driveFiles = data.files || [];
    } catch (err) {
      console.error('Error loading drive files:', err);
      error = 'Fehler beim Laden der Drive-Dateien';
    }
  }
  
  async function analyzeReceipt(fileId: string, filename: string) {
    analyzing = true;
    try {
      const response = await fetch('/api/receipts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId })
      });
      
      if (!response.ok) throw new Error('Failed to analyze receipt');
      
      const result = await response.json();
      await loadReceipts(); // Reload to show new receipt
      
      alert(`Beleg "${filename}" wurde erfolgreich analysiert!`);
    } catch (err) {
      alert('Fehler bei der Analyse: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      analyzing = false;
    }
  }
  
  async function uploadReceipt() {
    if (!selectedFile || !receiptsFolderId) return;
    
    uploading = true;
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folderId', receiptsFolderId);
      
      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const uploadedFile = await response.json();
      
      // Automatically analyze after upload
      await analyzeReceipt(uploadedFile.id, uploadedFile.name);
      
      selectedFile = null;
      await loadDriveFiles();
    } catch (err) {
      alert('Upload fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      uploading = false;
    }
  }
  
  async function deleteReceipt(id: string) {
    if (!confirm('Möchten Sie diesen Beleg wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/receipts/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete receipt');
      
      await loadReceipts();
    } catch (err) {
      alert('Fehler beim Löschen: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }
  
  function formatDate(dateString?: string) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-AT');
  }
  
  function formatCurrency(amount: number, currency = 'EUR') {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  $: filteredReceipts = receipts.filter(receipt => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      receipt.vendor.toLowerCase().includes(query) ||
      receipt.invoice_number?.toLowerCase().includes(query) ||
      receipt.category?.toLowerCase().includes(query)
    );
  });
  
  onMount(() => {
    loadReceipts();
    loadDriveFiles();
  });
</script>

<div class="container mx-auto p-4">
  <div class="mb-6">
    <h1 class="text-3xl font-bold mb-4">Belege</h1>
    
    <!-- Tabs -->
    <div class="flex gap-1 bg-ink/5 rounded-lg p-1 mb-4 max-w-xs">
      <button
        on:click={() => activeTab = 'table'}
        class="flex-1 px-4 py-2 rounded {activeTab === 'table' ? 'bg-white shadow-sm' : 'hover:bg-ink/5'} transition-all"
      >
        Tabelle
      </button>
      <button
        on:click={() => activeTab = 'drive'}
        class="flex-1 px-4 py-2 rounded {activeTab === 'drive' ? 'bg-white shadow-sm' : 'hover:bg-ink/5'} transition-all"
      >
        Drive Upload
      </button>
    </div>
    
    <!-- Search -->
    <div class="relative max-w-md">
      <MagnifyingGlass size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
      <input
        type="search"
        bind:value={searchQuery}
        placeholder="Suche nach Händler, Nummer, Kategorie..."
        class="w-full pl-10 pr-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
      />
    </div>
  </div>
  
  {#if error}
    <div class="bg-red-100/50 border border-red-400/50 text-red-700 px-4 py-3 rounded mb-4">
      {error}
      {#if error.includes('Google')}
        <a href="/api/auth/google?action=login" class="ml-2 underline">Mit Google verbinden</a>
      {/if}
    </div>
  {/if}
  
  {#if activeTab === 'table'}
    <!-- Table View -->
    {#if loading}
      <div class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
      </div>
    {:else if filteredReceipts.length === 0}
      <div class="text-center py-12">
        <Receipt size={48} class="mx-auto text-ink/30 mb-4" />
        <p class="text-ink/60">Keine Belege gefunden</p>
        <button
          on:click={() => activeTab = 'drive'}
          class="mt-4 px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90"
        >
          Beleg hochladen
        </button>
      </div>
    {:else}
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 overflow-hidden">
        <table class="w-full">
          <thead class="bg-ink/5 text-sm">
            <tr>
              <th class="text-left px-4 py-3">Datum</th>
              <th class="text-left px-4 py-3">Bezahldatum</th>
              <th class="text-left px-4 py-3">Händler</th>
              <th class="text-left px-4 py-3">Rechnungsnummer</th>
              <th class="text-right px-4 py-3">Betrag</th>
              <th class="text-left px-4 py-3">Dateiname</th>
              <th class="text-center px-4 py-3">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink/10">
            {#each filteredReceipts as receipt}
              <tr class="hover:bg-ink/5 transition-colors">
                <td class="px-4 py-3 text-sm">{formatDate(receipt.invoice_date)}</td>
                <td class="px-4 py-3 text-sm">{formatDate(receipt.payment_date)}</td>
                <td class="px-4 py-3">
                  <div>
                    <p class="font-medium">{receipt.vendor}</p>
                    {#if receipt.category}
                      <p class="text-xs text-ink/60">{receipt.category}</p>
                    {/if}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm font-mono">{receipt.invoice_number || '-'}</td>
                <td class="px-4 py-3 text-right font-medium">
                  {formatCurrency(receipt.amount, receipt.currency)}
                </td>
                <td class="px-4 py-3 text-sm">{receipt.filename || '-'}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-2">
                    {#if receipt.drive_file_url}
                      <a
                        href={receipt.drive_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="p-1 text-ink/60 hover:text-accent-green"
                        title="In Google Drive öffnen"
                      >
                        <Eye size={18} />
                      </a>
                    {/if}
                    <button
                      on:click={() => deleteReceipt(receipt.id)}
                      class="p-1 text-ink/60 hover:text-red-600"
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
    <!-- Drive Upload View -->
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">Beleg hochladen</label>
        <input
          type="file"
          accept="image/*,.pdf"
          capture="environment"
          on:change={(e) => selectedFile = e.target.files?.[0] || null}
          class="w-full px-3 py-2 border border-ink/20 rounded-lg"
        />
        <p class="mt-2 text-sm text-ink/60">
          <Camera size={16} class="inline mr-1" />
          Auf Mobilgeräten können Sie direkt ein Foto aufnehmen
        </p>
      </div>
      
      {#if selectedFile}
        <button
          on:click={uploadReceipt}
          disabled={uploading}
          class="w-full px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {#if uploading}
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Wird hochgeladen...
          {:else}
            <Upload size={20} />
            Hochladen & Analysieren
          {/if}
        </button>
      {/if}
    </div>
    
    <!-- Drive Files -->
    {#if driveFiles.length > 0}
      <div class="mt-6">
        <h2 class="text-lg font-semibold mb-2">Belege Eingang - Nicht analysierte Dateien</h2>
        <p class="text-sm text-ink/60 mb-4">
          <FolderOpen size={16} class="inline mr-1" />
          Diese Dateien befinden sich im Eingangsordner und warten auf Analyse
        </p>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each driveFiles as file}
            <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
              <p class="font-medium truncate">{file.name}</p>
              <p class="text-sm text-ink/60 mb-3">{formatDate(file.modifiedTime)}</p>
              <button
                on:click={() => analyzeReceipt(file.id, file.name)}
                disabled={analyzing}
                class="w-full px-3 py-2 bg-accent-green/10 text-accent-green rounded hover:bg-accent-green/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {#if analyzing}
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-green"></div>
                {:else}
                  <Sparkle size={16} />
                {/if}
                Mit KI analysieren
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Preview Modal -->
{#if showPreview && previewReceipt}
  <div class="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between p-4 border-b border-ink/10">
        <h3 class="font-semibold">Beleg Details</h3>
        <button
          on:click={() => showPreview = false}
          class="p-2 rounded-lg hover:bg-ink/5"
        >
          <X size={20} />
        </button>
      </div>
      
      <div class="flex-1 overflow-auto p-6">
        <dl class="grid grid-cols-2 gap-4">
          <div>
            <dt class="text-sm text-ink/60">Händler</dt>
            <dd class="font-medium">{previewReceipt.vendor}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink/60">Rechnungsnummer</dt>
            <dd class="font-medium">{previewReceipt.invoice_number || '-'}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink/60">Rechnungsdatum</dt>
            <dd class="font-medium">{formatDate(previewReceipt.invoice_date)}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink/60">Bezahldatum</dt>
            <dd class="font-medium">{formatDate(previewReceipt.payment_date)}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink/60">Betrag</dt>
            <dd class="font-medium text-lg">{formatCurrency(previewReceipt.amount, previewReceipt.currency)}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink/60">Kategorie</dt>
            <dd class="font-medium">{previewReceipt.category || '-'}</dd>
          </div>
        </dl>
        
        {#if previewReceipt.analysis_confidence}
          <div class="mt-4 p-3 bg-accent-green/10 rounded">
            <p class="text-sm">
              <Sparkle size={16} class="inline mr-1" />
              KI-Analyse Konfidenz: {Math.round(previewReceipt.analysis_confidence * 100)}%
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}