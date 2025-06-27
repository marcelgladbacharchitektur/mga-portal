<script lang="ts">
  import { onMount } from 'svelte';
  import { Receipt, Upload, Camera, MagnifyingGlass, Download, Eye, Trash, FolderOpen, X } from 'phosphor-svelte';
  
  interface Receipt {
    id: string;
    name: string;
    mimeType: string;
    size?: number;
    createdTime: string;
    modifiedTime: string;
    webViewLink?: string;
    webContentLink?: string;
    thumbnailLink?: string;
    parents?: string[];
  }
  
  let receipts: Receipt[] = [];
  let loading = true;
  let error = '';
  let uploading = false;
  let searchQuery = '';
  let selectedFile: File | null = null;
  let receiptsFolderId = '';
  let showPreview = false;
  let previewUrl = '';
  
  async function loadReceipts() {
    loading = true;
    error = '';
    
    try {
      // First, get or create receipts folder
      const folderResponse = await fetch('/api/receipts/folder');
      if (!folderResponse.ok) {
        if (folderResponse.status === 401) {
          error = 'Nicht mit Google Drive verbunden';
          return;
        }
        throw new Error('Failed to get receipts folder');
      }
      
      const folderData = await folderResponse.json();
      receiptsFolderId = folderData.id;
      
      // Then load receipts
      const response = await fetch(`/api/receipts?folderId=${receiptsFolderId}`);
      if (!response.ok) throw new Error('Failed to load receipts');
      
      const data = await response.json();
      receipts = data.files || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
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
      
      if (!response.ok) throw new Error('Failed to upload receipt');
      
      await loadReceipts();
      selectedFile = null;
      
      // Reset file input
      const input = document.getElementById('file-input') as HTMLInputElement;
      if (input) input.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      alert('Fehler beim Hochladen des Belegs');
    } finally {
      uploading = false;
    }
  }
  
  async function deleteReceipt(id: string, name: string) {
    if (!confirm(`Beleg "${name}" wirklich löschen?`)) return;
    
    try {
      const response = await fetch(`/api/receipts/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete receipt');
      
      receipts = receipts.filter(r => r.id !== id);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Fehler beim Löschen des Belegs');
    }
  }
  
  function showReceiptPreview(receipt: Receipt) {
    if (receipt.mimeType.startsWith('image/')) {
      previewUrl = receipt.thumbnailLink || receipt.webContentLink || '';
      showPreview = true;
    } else if (receipt.webViewLink) {
      window.open(receipt.webViewLink, '_blank');
    }
  }
  
  function formatFileSize(bytes?: number) {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  $: filteredReceipts = receipts.filter(receipt => 
    searchQuery === '' || 
    receipt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  onMount(() => {
    loadReceipts();
  });
</script>

<div class="container mx-auto p-4">
  <div class="mb-6">
    <h1 class="text-3xl font-bold mb-4">Belege</h1>
    
    <!-- Controls -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- Search -->
      <div class="relative flex-1 max-w-md">
        <MagnifyingGlass size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="Belege suchen..."
          class="w-full pl-10 pr-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
        />
      </div>
      
      <!-- Upload Section -->
      <div class="flex gap-3">
        <input
          id="file-input"
          type="file"
          accept="image/*,application/pdf"
          on:change={handleFileSelect}
          class="hidden"
        />
        <label
          for="file-input"
          class="px-4 py-2 bg-ink/10 text-ink rounded-lg hover:bg-ink/20 transition-colors cursor-pointer flex items-center gap-2"
        >
          <Upload size={20} />
          <span>Datei wählen</span>
        </label>
        
        {#if selectedFile}
          <button
            on:click={uploadReceipt}
            disabled={uploading}
            class="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {#if uploading}
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Wird hochgeladen...</span>
            {:else}
              <Upload size={20} />
              <span>Hochladen</span>
            {/if}
          </button>
        {/if}
      </div>
    </div>
    
    {#if selectedFile}
      <div class="mt-2 text-sm text-ink/60">
        Ausgewählt: {selectedFile.name} ({formatFileSize(selectedFile.size)})
      </div>
    {/if}
  </div>
  
  {#if error}
    <div class="bg-red-100/50 border border-red-400/50 text-red-700 px-4 py-3 rounded mb-4">
      <p class="font-medium">{error}</p>
      {#if error.includes('Google')}
        <a 
          href="/api/auth/google?action=login" 
          class="inline-block mt-2 px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-800 transition-colors"
        >
          Mit Google anmelden
        </a>
      {/if}
    </div>
  {/if}
  
  <!-- Mobile Upload Hint -->
  <div class="lg:hidden mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div class="flex items-start gap-3">
      <Camera size={24} class="text-blue-600 flex-shrink-0 mt-0.5" />
      <div class="text-sm">
        <p class="font-medium text-blue-900">Tipp für mobile Nutzung:</p>
        <p class="text-blue-700">Nutzen Sie "Datei wählen" um direkt ein Foto mit der Kamera aufzunehmen oder aus der Galerie zu wählen.</p>
      </div>
    </div>
  </div>
  
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
    </div>
  {:else if filteredReceipts.length === 0}
    <div class="text-center py-12">
      <Receipt size={48} class="mx-auto text-ink/30 mb-4" />
      <p class="text-ink/60">
        {searchQuery ? 'Keine Belege gefunden' : 'Noch keine Belege hochgeladen'}
      </p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each filteredReceipts as receipt}
        <div class="bg-white rounded-lg shadow-sm border border-ink/10 overflow-hidden hover:shadow-md transition-shadow">
          <!-- Thumbnail -->
          <div class="aspect-[4/3] bg-ink/5 relative group">
            {#if receipt.thumbnailLink}
              <img 
                src={receipt.thumbnailLink} 
                alt={receipt.name}
                class="w-full h-full object-cover"
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center">
                <Receipt size={48} class="text-ink/30" />
              </div>
            {/if}
            
            <!-- Hover Actions -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                on:click={() => showReceiptPreview(receipt)}
                class="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Anzeigen"
              >
                <Eye size={20} class="text-ink" />
              </button>
              {#if receipt.webContentLink}
                <a
                  href={receipt.webContentLink}
                  download
                  class="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Herunterladen"
                >
                  <Download size={20} class="text-ink" />
                </a>
              {/if}
              <button
                on:click={() => deleteReceipt(receipt.id, receipt.name)}
                class="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Löschen"
              >
                <Trash size={20} class="text-red-600" />
              </button>
            </div>
          </div>
          
          <!-- Info -->
          <div class="p-3">
            <p class="font-medium text-sm truncate" title={receipt.name}>
              {receipt.name}
            </p>
            <p class="text-xs text-ink/60 mt-1">
              {formatDate(receipt.createdTime)}
            </p>
            {#if receipt.size}
              <p class="text-xs text-ink/60">
                {formatFileSize(receipt.size)}
              </p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Image Preview Modal -->
{#if showPreview}
  <div 
    class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
    on:click={() => showPreview = false}
  >
    <img 
      src={previewUrl} 
      alt="Beleg Vorschau"
      class="max-w-full max-h-full object-contain"
    />
    <button
      on:click={() => showPreview = false}
      class="absolute top-4 right-4 p-2 bg-white rounded-full"
    >
      <X size={24} class="text-ink" />
    </button>
  </div>
{/if}