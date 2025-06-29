<script lang="ts">
  import { onMount } from 'svelte';
  import { Gear, FolderOpen, FloppyDisk, ArrowsClockwise, Check, ArrowSquareOut } from 'phosphor-svelte';
  
  interface Settings {
    drive_folders: {
      receipts: string;
      receipts_archive: string;
      bank_statements: string;
      projects_root: string;
    };
  }
  
  let settings: Settings = {
    drive_folders: {
      receipts: '',
      receipts_archive: '',
      bank_statements: '',
      projects_root: ''
    }
  };
  
  let loading = true;
  let savingField: string | null = null;
  let savedFields: Set<string> = new Set();
  let error = '';
  let folderNames: Record<string, string> = {};
  
  async function loadSettings() {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      
      const data = await response.json();
      if (data) {
        settings = data;
        // Load folder names for existing IDs
        for (const [key, folderId] of Object.entries(settings.drive_folders)) {
          if (folderId) {
            getFolderInfo(key, folderId as string);
          }
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      error = 'Fehler beim Laden der Einstellungen';
    } finally {
      loading = false;
    }
  }
  
  async function saveField(fieldName: string) {
    savingField = fieldName;
    error = '';
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        const data = await response.json();
        if (data.requiresMigration) {
          throw new Error('Die Datenbank-Tabellen müssen erst erstellt werden. Bitte wenden Sie sich an den Administrator.');
        }
        throw new Error('Failed to save settings');
      }
      
      savedFields.add(fieldName);
      setTimeout(() => savedFields.delete(fieldName), 3000);
      
      // Get folder info for the saved field
      const folderId = settings.drive_folders[fieldName as keyof typeof settings.drive_folders];
      if (folderId) {
        getFolderInfo(fieldName, folderId);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      error = 'Fehler beim Speichern der Einstellungen';
    } finally {
      savingField = null;
    }
  }
  
  async function getFolderInfo(key: string, folderId: string) {
    if (!folderId) return;
    
    try {
      const response = await fetch(`/api/drive/folder-info?folderId=${folderId}`);
      if (!response.ok) return;
      
      const data = await response.json();
      folderNames[key] = data.name;
    } catch (err) {
      console.error('Error getting folder info:', err);
    }
  }
  
  function getDriveUrl(folderId: string) {
    return folderId ? `https://drive.google.com/drive/folders/${folderId}` : '';
  }
  
  onMount(() => {
    loadSettings();
  });
</script>

<div class="container mx-auto p-4 max-w-4xl">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-3xl font-bold flex items-center gap-3">
      <Gear size={32} />
      Einstellungen
    </h1>
  </div>
  
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
    </div>
  {:else}
    <div class="space-y-8">
      <!-- Google Drive Folders -->
      <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <FolderOpen size={24} />
          Google Drive Ordner
        </h2>
        
        <p class="text-sm text-ink/60 mb-6">
          Geben Sie die Google Drive Ordner-IDs ein. Sie finden die ID in der URL des Ordners nach "folders/".
        </p>
        
        <div class="space-y-6">
          <!-- Receipts Folder -->
          <div class="border border-ink/10 rounded-lg p-4">
            <label class="block text-sm font-medium text-ink mb-2">
              Belege-Ordner
            </label>
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                bind:value={settings.drive_folders.receipts}
                placeholder="z.B. 100iNRjpLvKTywgWlDZxdrcTKynHN1tDP"
                class="flex-1 px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
              />
              <button
                on:click={() => saveField('receipts')}
                disabled={savingField === 'receipts'}
                class="px-3 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 disabled:bg-ink/30 flex items-center gap-2"
              >
                {#if savingField === 'receipts'}
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {:else if savedFields.has('receipts')}
                  <Check size={20} />
                {:else}
                  <FloppyDisk size={20} />
                {/if}
              </button>
            </div>
            {#if settings.drive_folders.receipts && folderNames.receipts}
              <div class="flex items-center gap-2 text-sm text-ink/60">
                <FolderOpen size={16} />
                <span>{folderNames.receipts}</span>
                <a 
                  href={getDriveUrl(settings.drive_folders.receipts)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:text-blue-700"
                >
                  <ArrowSquareOut size={16} />
                </a>
              </div>
            {/if}
            <p class="text-xs text-ink/60 mt-1">
              Hauptordner für alle Belege (nach Jahr/Monat organisiert)
            </p>
          </div>
          
          <!-- Bank Statements Folder -->
          <div class="border border-ink/10 rounded-lg p-4">
            <label class="block text-sm font-medium text-ink mb-2">
              Kontoauszüge-Ordner
            </label>
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                bind:value={settings.drive_folders.bank_statements}
                placeholder="z.B. 1vF8FGdYD4ROcgdmAggL1beLWQrmKXbyF"
                class="flex-1 px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
              />
              <button
                on:click={() => saveField('bank_statements')}
                disabled={savingField === 'bank_statements'}
                class="px-3 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 disabled:bg-ink/30 flex items-center gap-2"
              >
                {#if savingField === 'bank_statements'}
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {:else if savedFields.has('bank_statements')}
                  <Check size={20} />
                {:else}
                  <FloppyDisk size={20} />
                {/if}
              </button>
            </div>
            {#if settings.drive_folders.bank_statements && folderNames.bank_statements}
              <div class="flex items-center gap-2 text-sm text-ink/60">
                <FolderOpen size={16} />
                <span>{folderNames.bank_statements}</span>
                <a 
                  href={getDriveUrl(settings.drive_folders.bank_statements)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:text-blue-700"
                >
                  <ArrowSquareOut size={16} />
                </a>
              </div>
            {/if}
            <p class="text-xs text-ink/60 mt-1">
              Ordner für Kontoauszüge
            </p>
          </div>
          
          <!-- Projects Root Folder -->
          <div class="border border-ink/10 rounded-lg p-4">
            <label class="block text-sm font-medium text-ink mb-2">
              Projekte-Hauptordner
            </label>
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                bind:value={settings.drive_folders.projects_root}
                placeholder="z.B. 1ABC..."
                class="flex-1 px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50"
              />
              <button
                on:click={() => saveField('projects_root')}
                disabled={savingField === 'projects_root'}
                class="px-3 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 disabled:bg-ink/30 flex items-center gap-2"
              >
                {#if savingField === 'projects_root'}
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {:else if savedFields.has('projects_root')}
                  <Check size={20} />
                {:else}
                  <FloppyDisk size={20} />
                {/if}
              </button>
            </div>
            {#if settings.drive_folders.projects_root && folderNames.projects_root}
              <div class="flex items-center gap-2 text-sm text-ink/60">
                <FolderOpen size={16} />
                <span>{folderNames.projects_root}</span>
                <a 
                  href={getDriveUrl(settings.drive_folders.projects_root)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:text-blue-700"
                >
                  <ArrowSquareOut size={16} />
                </a>
              </div>
            {/if}
            <p class="text-xs text-ink/60 mt-1">
              Hauptordner, in dem alle Projektordner erstellt werden
            </p>
          </div>
        </div>
      </div>
      
      {#if error}
        <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-600 text-sm">{error}</p>
        </div>
      {/if}
    </div>
  {/if}
</div>