<script>
  import { onMount } from 'svelte';
  
  let testUrl = '';
  let testResults = null;
  let loading = false;
  
  async function runTest() {
    loading = true;
    testResults = null;
    
    try {
      const params = new URLSearchParams();
      if (testUrl) params.set('url', testUrl);
      
      const response = await fetch(`/api/drive/test?${params}`);
      testResults = await response.json();
    } catch (error) {
      console.error('Test error:', error);
      testResults = { error: error.message };
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Google Drive Diagnose</h1>
  
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <label class="block mb-2 font-semibold">Drive URL zum Testen:</label>
    <input
      type="text"
      bind:value={testUrl}
      placeholder="https://drive.google.com/drive/folders/..."
      class="w-full px-3 py-2 border border-ink/20 rounded-lg mb-4"
    />
    
    <button
      on:click={runTest}
      disabled={loading}
      class="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 disabled:opacity-50"
    >
      {loading ? 'Teste...' : 'Test durchführen'}
    </button>
  </div>
  
  {#if testResults}
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Test Ergebnisse</h2>
      
      {#if testResults.error}
        <div class="bg-red-100 p-4 rounded mb-4">
          <p class="text-red-700 font-semibold">Fehler: {testResults.error}</p>
          {#if testResults.details}
            <p class="text-red-600 text-sm mt-1">{testResults.details}</p>
          {/if}
        </div>
      {:else}
        <!-- User Info -->
        {#if testResults.user}
          <div class="mb-6">
            <h3 class="font-semibold mb-2">Google Account:</h3>
            <p>Name: {testResults.user.displayName}</p>
            <p>Email: {testResults.user.emailAddress}</p>
          </div>
        {/if}
        
        <!-- URL Analysis -->
        {#if testResults.urlAnalysis}
          <div class="mb-6">
            <h3 class="font-semibold mb-2">URL Analyse:</h3>
            <p class="text-sm font-mono bg-gray-100 p-2 rounded mb-2 break-all">
              Original: {testResults.urlAnalysis.originalUrl}
            </p>
            <p class="text-sm font-mono bg-gray-100 p-2 rounded">
              Extrahierte ID: {testResults.urlAnalysis.extractedId}
            </p>
          </div>
        {/if}
        
        <!-- Folder Access -->
        {#if testResults.folderAccess}
          <div class="mb-6">
            <h3 class="font-semibold mb-2">Ordner Zugriff:</h3>
            {#if testResults.folderAccess.success}
              <div class="bg-green-50 p-4 rounded">
                <p class="text-green-700 font-semibold mb-2">✅ Zugriff erfolgreich</p>
                <p>Name: {testResults.folderAccess.folder.name}</p>
                <p>ID: {testResults.folderAccess.folder.id}</p>
                {#if testResults.folderAccess.folder.owners}
                  <p>Eigentümer: {testResults.folderAccess.folder.owners.map(o => o.emailAddress).join(', ')}</p>
                {/if}
              </div>
            {:else}
              <div class="bg-red-50 p-4 rounded">
                <p class="text-red-700 font-semibold">❌ Zugriff fehlgeschlagen</p>
                <p>Code: {testResults.folderAccess.error.code}</p>
                <p>Nachricht: {testResults.folderAccess.error.message}</p>
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- List Files -->
        {#if testResults.listFiles}
          <div class="mb-6">
            <h3 class="font-semibold mb-2">Dateien im Ordner:</h3>
            {#if testResults.listFiles.success}
              <p class="text-green-700">✅ {testResults.listFiles.fileCount} Dateien gefunden</p>
              {#if testResults.listFiles.files && testResults.listFiles.files.length > 0}
                <ul class="mt-2 list-disc list-inside">
                  {#each testResults.listFiles.files as file}
                    <li class="text-sm">{file.name}</li>
                  {/each}
                </ul>
              {/if}
            {:else}
              <p class="text-red-700">❌ Fehler: {testResults.listFiles.error.message}</p>
            {/if}
          </div>
        {/if}
        
        <!-- Test Summary -->
        <div class="mb-6">
          <h3 class="font-semibold mb-2">Test Zusammenfassung:</h3>
          <div class="space-y-2">
            {#each testResults.tests as test}
              <div class="flex items-center gap-2">
                <span class="{test.status === 'success' ? 'text-green-600' : 'text-red-600'}">
                  {test.status === 'success' ? '✅' : '❌'}
                </span>
                <span>{test.test}</span>
                {#if test.error}
                  <span class="text-sm text-red-600">({test.error})</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
        
        <!-- Root Folders -->
        {#if testResults.rootFolders?.success}
          <div>
            <h3 class="font-semibold mb-2">Ihre Drive Ordner:</h3>
            <ul class="list-disc list-inside">
              {#each testResults.rootFolders.folders as folder}
                <li class="text-sm">{folder.name} (ID: {folder.id})</li>
              {/each}
            </ul>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>