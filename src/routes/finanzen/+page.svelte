<script lang="ts">
  import { Receipt, FileText, Calculator, ChartBar, CurrencyCircleDollar, ArrowRight, Bank } from 'phosphor-svelte';
  import { onMount } from 'svelte';
  
  interface FinanceSection {
    title: string;
    description: string;
    icon: any;
    href: string;
    color: string;
  }
  
  const sections: FinanceSection[] = [
    {
      title: 'Kontoauszüge',
      description: 'Bank-Transaktionen importieren und analysieren',
      icon: Bank,
      href: '/finanzen/kontoauszuege',
      color: 'bg-blue-500'
    },
    {
      title: 'Belege',
      description: 'Rechnungen und Quittungen verwalten',
      icon: Receipt,
      href: '/belege',
      color: 'bg-green-500'
    },
    {
      title: 'Rechnungen',
      description: 'Ausgangsrechnungen erstellen und verwalten',
      icon: FileText,
      href: '/finanzen/rechnungen',
      color: 'bg-purple-500'
    },
    {
      title: 'Übersicht',
      description: 'Finanzberichte und Analysen',
      icon: ChartBar,
      href: '/finanzen/uebersicht',
      color: 'bg-amber-500'
    }
  ];
  
  // Quick stats
  let stats = {
    monthlyIncome: 0,
    monthlyExpenses: 0,
    openInvoices: 0,
    pendingReceipts: 0
  };
  
  async function loadStats() {
    // TODO: Implement stats loading from API
    try {
      // Real data will be loaded here when endpoints are ready
    } catch (error) {
      console.error('Error loading financial stats:', error);
    }
  }
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
  
  onMount(() => {
    loadStats();
  });
</script>

<div class="container mx-auto p-4">
  <div class="mb-6">
    <h1 class="text-3xl font-bold flex items-center gap-3">
      <CurrencyCircleDollar size={32} />
      Finanzen
    </h1>
    <p class="text-ink/60 mt-2">Verwalten Sie Ihre Finanzen an einem Ort</p>
  </div>
  
  <!-- Quick Stats -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-ink/60">Einnahmen (Monat)</p>
          <p class="text-2xl font-bold text-green-600">{formatCurrency(stats.monthlyIncome)}</p>
        </div>
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <ArrowRight size={24} class="text-green-600 rotate-[-45deg]" />
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-ink/60">Ausgaben (Monat)</p>
          <p class="text-2xl font-bold text-red-600">{formatCurrency(stats.monthlyExpenses)}</p>
        </div>
        <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <ArrowRight size={24} class="text-red-600 rotate-[135deg]" />
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-ink/60">Offene Rechnungen</p>
          <p class="text-2xl font-bold">{stats.openInvoices}</p>
        </div>
        <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
          <FileText size={24} class="text-amber-600" />
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-sm border border-ink/10 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-ink/60">Unbearbeitete Belege</p>
          <p class="text-2xl font-bold">{stats.pendingReceipts}</p>
        </div>
        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <Receipt size={24} class="text-purple-600" />
        </div>
      </div>
    </div>
  </div>
  
  <!-- Section Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {#each sections as section}
      <a
        href={section.href}
        class="bg-white rounded-lg shadow-sm border border-ink/10 p-6 hover:shadow-md transition-shadow group"
      >
        <div class="flex items-start gap-4">
          <div class={`w-12 h-12 ${section.color} text-white rounded-lg flex items-center justify-center flex-shrink-0`}>
            <svelte:component this={section.icon} size={24} />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold mb-1 group-hover:text-accent-green transition-colors">
              {section.title}
            </h3>
            <p class="text-sm text-ink/60">
              {section.description}
            </p>
          </div>
          <ArrowRight size={20} class="text-ink/30 group-hover:text-accent-green transition-colors" />
        </div>
      </a>
    {/each}
  </div>
  
  <!-- Recent Activity -->
  <div class="mt-8 bg-white rounded-lg shadow-sm border border-ink/10 p-6">
    <h2 class="text-lg font-semibold mb-4">Letzte Aktivitäten</h2>
    <p class="text-sm text-ink/60">Noch keine Aktivitäten vorhanden</p>
  </div>
</div>