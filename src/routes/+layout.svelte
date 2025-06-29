<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { House, FolderOpen, Clock, Receipt, Users, Plus, CheckSquare, DotsThree, CurrencyCircleDollar, Gear } from 'phosphor-svelte';
  import OmniCreate from '$lib/components/OmniCreate.svelte';
  
  let omniCreateOpen = false;
  let moreMenuOpen = false;
  
  $: currentPath = $page.url.pathname;
  
  const menuItems = [
    { href: '/', label: 'Dashboard', icon: House },
    { href: '/projekte', label: 'Projekte', icon: FolderOpen },
    { href: '/zeiterfassung', label: 'Zeit', icon: Clock },
    { href: '/finanzen', label: 'Finanzen', icon: CurrencyCircleDollar },
    { href: '/kontakte', label: 'Kontakte', icon: Users },
    { href: '/aufgaben', label: 'Aufgaben', icon: CheckSquare },
    { href: '/einstellungen', label: 'Einstellungen', icon: Gear },
  ];
  
  // Primary items for mobile (most used)
  const primaryMobileItems = menuItems.slice(0, 4);
  const secondaryMobileItems = menuItems.slice(4);
</script>

<div class="min-h-screen bg-paper">
  <!-- Desktop Sidebar -->
  <aside class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
    <div class="flex flex-col flex-grow border-r border-ink/10 bg-white px-6 pb-4">
      <div class="flex h-16 shrink-0 items-center">
        <h1 class="text-xl font-semibold text-accent-green">MGA Portal</h1>
      </div>
      <nav class="mt-5 flex-1 space-y-1">
        {#each menuItems as item}
          <a
            href={item.href}
            class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors {currentPath === item.href ? 'bg-accent-green text-white' : 'text-ink hover:bg-ink/5'}"
          >
            <svelte:component this={item.icon} size={20} class="mr-3" />
            {item.label}
          </a>
        {/each}
      </nav>
    </div>
  </aside>

  <!-- Mobile bottom navigation -->
  <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-ink/10 pb-safe z-50">
    <div class="flex justify-around items-center py-2">
      {#each primaryMobileItems as item}
        <a
          href={item.href}
          class="flex flex-col items-center py-2 px-3 text-xs {currentPath === item.href ? 'text-accent-green' : 'text-ink/60'}"
        >
          <svelte:component this={item.icon} size={24} weight={currentPath === item.href ? 'fill' : 'regular'} class="mb-1" />
          <span class="text-[11px] font-medium">{item.label}</span>
        </a>
      {/each}
      
      <button
        on:click={() => moreMenuOpen = !moreMenuOpen}
        class="flex flex-col items-center py-2 px-3 text-xs {secondaryMobileItems.some(item => item.href === currentPath) ? 'text-accent-green' : 'text-ink/60'}"
      >
        <DotsThree size={24} weight={secondaryMobileItems.some(item => item.href === currentPath) ? 'fill' : 'regular'} class="mb-1" />
        <span class="text-[11px] font-medium">Mehr</span>
      </button>
    </div>
  </nav>
  
  <!-- More menu overlay -->
  {#if moreMenuOpen}
    <div 
      class="lg:hidden fixed inset-0 bg-ink/20 z-40" 
      on:click={() => moreMenuOpen = false}
    />
    <div class="lg:hidden fixed bottom-16 right-4 bg-white rounded-lg shadow-lg border border-ink/10 py-2 z-50">
      {#each secondaryMobileItems as item}
        <a
          href={item.href}
          on:click={() => moreMenuOpen = false}
          class="flex items-center px-4 py-3 hover:bg-ink/5 {currentPath === item.href ? 'text-accent-green' : 'text-ink'}"
        >
          <svelte:component this={item.icon} size={20} class="mr-3" />
          <span class="text-sm font-medium">{item.label}</span>
        </a>
      {/each}
    </div>
  {/if}

  <!-- Main content -->
  <div class="lg:pl-64">
    <!-- Mobile header -->
    <header class="lg:hidden sticky top-0 z-40 bg-white border-b border-ink/10">
      <div class="flex items-center justify-center px-4 py-3">
        <h1 class="text-lg font-semibold text-accent-green">MGA Portal</h1>
      </div>
    </header>

    <!-- Page content -->
    <main class="pb-20 lg:pb-0">
      <slot />
    </main>
  </div>

  <!-- Floating action button -->
  <button
    class="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 w-14 h-14 bg-accent-green text-white rounded-full flex items-center justify-center shadow-lg hover:bg-accent-green/90 transition-colors z-40"
    on:click={() => omniCreateOpen = true}
  >
    <Plus size={24} />
  </button>
</div>

<!-- Omni Create Menu -->
<OmniCreate bind:open={omniCreateOpen} on:action={(e) => {
  if (e.detail.href) {
    window.location.href = e.detail.href;
  }
}} />

<style>
  /* Add padding for iOS safe area */
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  
  /* Hide scrollbar but keep functionality */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
</style>