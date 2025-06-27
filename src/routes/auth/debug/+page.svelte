<script>
  import { onMount } from 'svelte';
  
  let debugInfo = null;
  let loading = true;
  
  onMount(async () => {
    try {
      const response = await fetch('/api/auth/google/debug');
      debugInfo = await response.json();
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      loading = false;
    }
  });
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">OAuth Debug Info</h1>
  
  {#if loading}
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green"></div>
  {:else if debugInfo}
    <div class="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <h2 class="font-semibold mb-2">Authentifizierung</h2>
        <p>Status: {debugInfo.authenticated ? '✅ Authentifiziert' : '❌ Nicht authentifiziert'}</p>
        {#if debugInfo.error}
          <p class="text-red-600">Fehler: {debugInfo.error}</p>
        {/if}
      </div>
      
      {#if debugInfo.tokenInfo}
        <div>
          <h2 class="font-semibold mb-2">Token Info</h2>
          <p>Email: {debugInfo.tokenInfo.email}</p>
          <p>Läuft ab in: {debugInfo.tokenInfo.expiresIn} Sekunden</p>
        </div>
        
        <div>
          <h2 class="font-semibold mb-2">Google Drive Zugriff</h2>
          <p>Status: {debugInfo.driveAccess ? '✅ Zugriff möglich' : '❌ Kein Zugriff'}</p>
          {#if debugInfo.driveError}
            <p class="text-red-600">Fehler: {debugInfo.driveError.code} - {debugInfo.driveError.message}</p>
          {/if}
        </div>
        
        <div>
          <h2 class="font-semibold mb-2">OAuth Scopes</h2>
          <ul class="list-disc list-inside space-y-1">
            {#each debugInfo.scopes as scope}
              <li class="text-sm font-mono">{scope}</li>
            {/each}
          </ul>
        </div>
      {/if}
      
      <div class="mt-6 pt-6 border-t">
        <a 
          href="/api/auth/google?action=login" 
          class="inline-block px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors"
        >
          Erneut mit Google anmelden
        </a>
      </div>
    </div>
  {/if}
</div>