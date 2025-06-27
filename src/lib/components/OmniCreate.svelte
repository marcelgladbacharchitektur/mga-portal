<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, FolderPlus, Clock, Receipt, UserPlus, CheckSquare } from 'phosphor-svelte';
  
  export let open = false;
  
  const dispatch = createEventDispatcher();
  
  const actions = [
    {
      id: 'project',
      label: 'Neues Projekt',
      icon: FolderPlus,
      color: 'bg-accent-green',
      href: '/projekte?action=new'
    },
    {
      id: 'task',
      label: 'Neue Aufgabe',
      icon: CheckSquare,
      color: 'bg-indigo-500',
      href: 'https://tasks.google.com',
      external: true
    },
    {
      id: 'time',
      label: 'Zeit erfassen',
      icon: Clock,
      color: 'bg-blue-500',
      href: '/zeiterfassung?action=new'
    },
    {
      id: 'contact',
      label: 'Neuer Kontakt',
      icon: UserPlus,
      color: 'bg-orange-500',
      href: '/kontakte?action=new'
    }
  ];
  
  function handleAction(action: typeof actions[0]) {
    if (action.external) {
      window.open(action.href, '_blank');
    } else {
      dispatch('action', action);
    }
    open = false;
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 transition-opacity"
    on:click={() => open = false}
  />
  
  <!-- Menu -->
  <div class="fixed inset-x-0 bottom-0 z-50 px-4 pb-safe">
    <div class="bg-white rounded-lg shadow-2xl border border-border">
      <!-- Header -->
      <div class="border-b border-border px-4 py-3">
        <h2 class="text-base font-medium text-ink">Neu erstellen</h2>
      </div>
      
      <!-- Actions List -->
      <div class="py-1">
        {#each actions as action}
          <a
            href={action.href}
            on:click|preventDefault={() => handleAction(action)}
            class="flex items-center px-4 py-3 hover:bg-paper transition-colors"
          >
            <div class="{action.color} w-10 h-10 rounded-lg flex items-center justify-center text-white">
              <svelte:component this={action.icon} size={20} weight="bold" />
            </div>
            <span class="ml-3 text-ink font-medium">{action.label}</span>
            {#if action.external}
              <span class="ml-auto text-xs text-ink/40">Extern</span>
            {/if}
          </a>
        {/each}
      </div>
      
      <!-- Cancel Button -->
      <div class="border-t border-border px-4 py-2">
        <button
          on:click={() => open = false}
          class="w-full py-2 text-ink/60 font-medium hover:text-ink transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 1rem);
  }
</style>