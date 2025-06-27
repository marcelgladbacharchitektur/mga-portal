<script lang="ts">
  import { onMount } from 'svelte';
  
  let authUrl = '';
  let isAuthenticated = false;
  
  onMount(async () => {
    // Check if already authenticated
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    isAuthenticated = data.authenticated;
    
    if (!isAuthenticated) {
      // Get auth URL
      const urlResponse = await fetch('/api/auth/url');
      const urlData = await urlResponse.json();
      authUrl = urlData.url;
    }
  });
</script>

<div class="container mx-auto p-4 max-w-2xl">
  <h1 class="text-3xl font-bold mb-6">Google Account Setup</h1>
  
  {#if isAuthenticated}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      ✅ Google Account ist bereits verbunden!
    </div>
  {:else if authUrl}
    <div class="space-y-4">
      <p class="text-gray-600">
        Da Ihre Organisation keine Service Account Keys erlaubt, verwenden wir OAuth2.
        Sie müssen sich einmalig mit Ihrem Google Account anmelden.
      </p>
      
      <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <strong>Wichtig:</strong> Verwenden Sie das Google-Konto, das Zugriff auf:
        <ul class="list-disc ml-5 mt-2">
          <li>Google Drive (für Projektordner)</li>
          <li>Google Calendar (für Projektkalender)</li>
          <li>Google Tasks (für Aufgabenlisten)</li>
        </ul>
      </div>
      
      <a 
        href={authUrl}
        class="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Mit Google Account verbinden
      </a>
    </div>
  {:else}
    <p class="text-gray-500">Lade...</p>
  {/if}
</div>