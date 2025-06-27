<script>
  import { onMount } from 'svelte';
  
  let authStatus = { authenticated: false };
  
  onMount(async () => {
    try {
      const response = await fetch('/api/auth/google/status');
      authStatus = await response.json();
    } catch (error) {
      console.error('Auth status error:', error);
    }
  });
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Google Authentifizierung</h1>
  
  <div class="bg-white rounded-lg shadow p-6">
    <p class="mb-4">Status: {authStatus.authenticated ? '✅ Verbunden' : '❌ Nicht verbunden'}</p>
    
    {#if !authStatus.authenticated}
      <a
        href="/api/auth/google?action=login"
        class="inline-block px-6 py-3 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors"
      >
        Mit Google anmelden
      </a>
    {:else}
      <p class="text-green-600">Sie sind bereits mit Google verbunden!</p>
    {/if}
  </div>
  
  <div class="mt-4 p-4 bg-gray-100 rounded">
    <pre>{JSON.stringify(authStatus, null, 2)}</pre>
  </div>
</div>