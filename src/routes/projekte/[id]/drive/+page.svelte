<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { 
    Folder, 
    File, 
    Image, 
    FilePdf, 
    FileDoc, 
    FileXls, 
    FilePpt,
    FileVideo,
    FileAudio,
    FileZip,
    Download,
    Eye,
    CaretLeft,
    House,
    MagnifyingGlass,
    List,
    GridFour,
    X
  } from 'phosphor-svelte';
  
  interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    size?: number;
    modifiedTime: string;
    webViewLink?: string;
    webContentLink?: string;
    thumbnailLink?: string;
    iconLink?: string;
    parents?: string[];
  }
  
  let files: DriveFile[] = [];
  let loading = true;
  let error = '';
  let currentFolderId = '';
  let folderPath: { id: string; name: string }[] = [];
  let searchQuery = '';
  let viewMode: 'grid' | 'list' = 'grid';
  let selectedFile: DriveFile | null = null;
  let showPreview = false;
  
  $: projectId = $page.params.id;
  
  async function loadFiles(folderId?: string) {
    loading = true;
    error = '';
    
    try {
      const params = new URLSearchParams();
      if (folderId) params.set('folderId', folderId);
      if (searchQuery) params.set('search', searchQuery);
      
      const response = await fetch(`/api/projects/${projectId}/drive?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          error = 'Nicht mit Google verbunden. Bitte melden Sie sich zuerst mit Google an.';
          return;
        }
        if (response.status === 403) {
          error = errorData.error;
          if (errorData.helpText) {
            error += '\n\n' + errorData.helpText;
          }
          if (errorData.needsReauth) {
            error += '\n\nBitte melden Sie sich erneut mit Google an, um die erforderlichen Berechtigungen zu erteilen.';
          }
          return;
        }
        if (response.status === 404) {
          error = errorData.error || 'Ordner nicht gefunden';
          return;
        }
        throw new Error(errorData.error || 'Failed to load files');
      }
      
      const data = await response.json();
      console.log('Frontend received:', data);
      console.log('Number of files:', data.files?.length);
      files = data.files || [];
      
      if (folderId && folderId !== currentFolderId) {
        if (folderId === 'root') {
          folderPath = [];
        } else {
          // Add to path
          const folder = files.find(f => f.id === folderId);
          if (folder) {
            folderPath = [...folderPath, { id: folderId, name: folder.name }];
          }
        }
        currentFolderId = folderId;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
  
  function getFileIcon(file: DriveFile) {
    const type = file.mimeType;
    
    if (type === 'application/vnd.google-apps.folder') return Folder;
    if (type.startsWith('image/')) return Image;
    if (type === 'application/pdf') return FilePdf;
    if (type.includes('document') || type.includes('word')) return FileDoc;
    if (type.includes('sheet') || type.includes('excel')) return FileXls;
    if (type.includes('presentation') || type.includes('powerpoint')) return FilePpt;
    if (type.startsWith('video/')) return FileVideo;
    if (type.startsWith('audio/')) return FileAudio;
    if (type.includes('zip') || type.includes('archive')) return FileZip;
    
    return File;
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
      year: 'numeric'
    });
  }
  
  function navigateToFolder(folderId: string, index?: number) {
    if (index !== undefined) {
      folderPath = folderPath.slice(0, index + 1);
    }
    loadFiles(folderId);
  }
  
  function handleFileClick(file: DriveFile) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      navigateToFolder(file.id);
    } else {
      // For Google Docs/Sheets/etc, open in new tab instead of preview
      if (file.mimeType.startsWith('application/vnd.google-apps.')) {
        window.open(file.webViewLink, '_blank');
      } else {
        selectedFile = file;
        showPreview = true;
      }
    }
  }
  
  onMount(() => {
    loadFiles();
  });
</script>

<div class="container mx-auto p-4">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-4">Drive Browser</h1>
    
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm mb-4">
      <button
        on:click={() => navigateToFolder('root')}
        class="flex items-center gap-1 text-ink/60 hover:text-accent-green transition-colors"
      >
        <House size={16} />
        <span>Root</span>
      </button>
      
      {#each folderPath as folder, i}
        <span class="text-ink/40">/</span>
        <button
          on:click={() => navigateToFolder(folder.id, i)}
          class="text-ink/60 hover:text-accent-green transition-colors"
        >
          {folder.name}
        </button>
      {/each}
    </div>
    
    <!-- Controls -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <MagnifyingGlass size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          type="search"
          bind:value={searchQuery}
          on:input={() => loadFiles(currentFolderId)}
          placeholder="Dateien suchen..."
          class="w-full pl-10 pr-4 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
        />
      </div>
      
      <div class="flex gap-2">
        <button
          on:click={() => viewMode = 'grid'}
          class="p-2 rounded-lg {viewMode === 'grid' ? 'bg-accent-green text-white' : 'text-ink/60 hover:bg-ink/5'}"
          title="Grid-Ansicht"
        >
          <GridFour size={20} />
        </button>
        <button
          on:click={() => viewMode = 'list'}
          class="p-2 rounded-lg {viewMode === 'list' ? 'bg-accent-green text-white' : 'text-ink/60 hover:bg-ink/5'}"
          title="Listen-Ansicht"
        >
          <List size={20} />
        </button>
      </div>
    </div>
  </div>
  
  <!-- Files -->
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
    </div>
  {:else if error}
    <div class="bg-red-100/50 border border-red-400/50 text-red-700 px-4 py-3 rounded">
      <p class="font-medium whitespace-pre-line">{error}</p>
      <div class="flex gap-3 mt-3">
        {#if error.includes('Google') || error.includes('Berechtigungen')}
          <a 
            href="/api/auth/google?action=login" 
            class="inline-block px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors"
          >
            Erneut mit Google anmelden
          </a>
        {/if}
        {#if error.includes('Zugriff') || error.includes('geteilt')}
          <a 
            href="/projekte/{projectId}" 
            class="inline-block px-4 py-2 bg-ink/10 text-ink rounded-lg hover:bg-ink/20 transition-colors"
          >
            Drive-Ordner ändern
          </a>
        {/if}
      </div>
    </div>
  {:else if files.length === 0}
    <div class="text-center py-12">
      <Folder size={48} class="mx-auto text-ink/30 mb-4" />
      <p class="text-ink/60">Keine Dateien gefunden</p>
    </div>
  {:else if viewMode === 'grid'}
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {#each files as file}
        <button
          on:click={() => handleFileClick(file)}
          class="flex flex-col items-center p-4 rounded-lg hover:bg-ink/5 transition-colors group"
        >
          {#if file.thumbnailLink && file.mimeType.startsWith('image/')}
            <img 
              src={file.thumbnailLink} 
              alt={file.name}
              class="w-20 h-20 object-cover rounded mb-2"
              on:error={(e) => {
                console.error('Thumbnail load error for:', file.name);
                e.target.style.display = 'none';
              }}
            />
          {:else}
            <svelte:component 
              this={getFileIcon(file)} 
              size={48} 
              class="text-ink/40 group-hover:text-accent-green mb-2"
            />
          {/if}
          <p class="text-sm text-center line-clamp-2">{file.name}</p>
        </button>
      {/each}
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 overflow-hidden">
      <table class="w-full">
        <thead class="bg-ink/5 text-sm">
          <tr>
            <th class="text-left px-4 py-3">Name</th>
            <th class="text-left px-4 py-3 hidden sm:table-cell">Geändert</th>
            <th class="text-left px-4 py-3 hidden md:table-cell">Größe</th>
            <th class="text-right px-4 py-3">Aktionen</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink/10">
          {#each files as file}
            <tr class="hover:bg-ink/5 transition-colors">
              <td class="px-4 py-3">
                <button
                  on:click={() => handleFileClick(file)}
                  class="flex items-center gap-3 text-left"
                >
                  <svelte:component 
                    this={getFileIcon(file)} 
                    size={20} 
                    class="text-ink/40 flex-shrink-0"
                  />
                  <span class="truncate">{file.name}</span>
                </button>
              </td>
              <td class="px-4 py-3 text-sm text-ink/60 hidden sm:table-cell">
                {formatDate(file.modifiedTime)}
              </td>
              <td class="px-4 py-3 text-sm text-ink/60 hidden md:table-cell">
                {formatFileSize(file.size)}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  {#if file.webViewLink}
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      class="p-1 text-ink/60 hover:text-accent-green"
                      title="In Drive öffnen"
                    >
                      <Eye size={18} />
                    </a>
                  {/if}
                  {#if file.webContentLink}
                    <a
                      href={file.webContentLink}
                      class="p-1 text-ink/60 hover:text-accent-green"
                      title="Herunterladen"
                    >
                      <Download size={18} />
                    </a>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- File Preview Modal -->
{#if showPreview && selectedFile}
  <div class="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between p-4 border-b border-ink/10">
        <h3 class="font-semibold truncate">{selectedFile.name}</h3>
        <div class="flex items-center gap-2">
          {#if selectedFile.webViewLink}
            <a
              href={selectedFile.webViewLink}
              target="_blank"
              class="p-2 rounded-lg hover:bg-ink/5 text-ink/60 hover:text-accent-green"
              title="In Google Drive öffnen"
            >
              <Eye size={20} />
            </a>
          {/if}
          <button
            on:click={() => showPreview = false}
            class="p-2 rounded-lg hover:bg-ink/5"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div class="flex-1 overflow-auto p-4">
        <div class="text-center py-12">
          <svelte:component 
            this={getFileIcon(selectedFile)} 
            size={64} 
            class="mx-auto text-ink/40 mb-4"
          />
          <p class="text-lg font-medium mb-2">{selectedFile.name}</p>
          <p class="text-sm text-ink/60 mb-6">
            {#if selectedFile.mimeType.startsWith('application/vnd.google-apps.')}
              Google Drive Datei - Klicken Sie auf "In Drive öffnen" um die Datei anzuzeigen
            {:else}
              Vorschau in der App nicht verfügbar
            {/if}
          </p>
          <div class="flex items-center justify-center gap-3">
            {#if selectedFile.webViewLink}
              <a
                href={selectedFile.webViewLink}
                target="_blank"
                class="inline-flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90"
              >
                <Eye size={20} />
                In Google Drive öffnen
              </a>
            {/if}
            {#if selectedFile.webContentLink}
              <a
                href={selectedFile.webContentLink}
                download
                class="inline-flex items-center gap-2 px-4 py-2 bg-ink/10 text-ink rounded-lg hover:bg-ink/20"
              >
                <Download size={20} />
                Herunterladen
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}