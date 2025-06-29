<script lang="ts">
  import { onMount } from 'svelte';
  
  export let start: string;
  export let end: string;
  export let projectId: string | null = null;
  export let onClose: () => void;
  
  let loading = true;
  let error = '';
  
  interface TimeEntry {
    id: string;
    date: string;
    duration_minutes: number;
    description?: string;
    billable: boolean;
    project?: {
      id: string;
      name: string;
      project_id: string;
    };
  }
  
  async function generatePDF() {
    try {
      // Fetch time entries
      let url = `/api/time-entries?start=${start}&end=${end}`;
      if (projectId) {
        url += `&project_id=${projectId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch time entries');
      
      const entries: TimeEntry[] = await response.json();
      
      // Import jsPDF dynamically (client-side only)
      const jsPDFModule = await import('jspdf');
      const { jsPDF } = jsPDFModule;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default;
      
      // Create PDF
      const doc = new jsPDF();
      
      // Title
      const startDate = new Date(start).toLocaleDateString('de-AT');
      const endDate = new Date(end).toLocaleDateString('de-AT');
      doc.setFontSize(20);
      doc.text('Stundenaufstellung', 14, 22);
      
      // Period
      doc.setFontSize(12);
      doc.text(`Zeitraum: ${startDate} - ${endDate}`, 14, 32);
      
      // Prepare data for table
      const tableData = entries.map(entry => {
        const date = new Date(entry.date).toLocaleDateString('de-AT');
        const hours = (entry.duration_minutes / 60).toFixed(2);
        const project = entry.project?.name || 'Unbekannt';
        const description = entry.description || '-';
        const billable = entry.billable ? 'Ja' : 'Nein';
        
        return [date, project, description, hours, billable];
      });
      
      // Add table
      autoTable(doc, {
        head: [['Datum', 'Projekt', 'Beschreibung', 'Stunden', 'Abrechenbar']],
        body: tableData,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [90, 97, 75] }, // accent-green
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 80 },
          3: { cellWidth: 20, halign: 'right' },
          4: { cellWidth: 25, halign: 'center' }
        }
      });
      
      // Summary
      const totalHours = entries.reduce((sum, e) => sum + (e.duration_minutes / 60), 0);
      const billableHours = entries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration_minutes / 60), 0);
      
      const finalY = (doc as any).lastAutoTable?.finalY || 50;
      doc.setFontSize(10);
      doc.text(`Gesamt: ${totalHours.toFixed(2)} Stunden`, 14, finalY + 10);
      doc.text(`Abrechenbar: ${billableHours.toFixed(2)} Stunden`, 14, finalY + 16);
      
      // Footer
      doc.setFontSize(8);
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-AT')}`, 14, 280);
      doc.text('Marcel Gladbach Architektur', 105, 280, { align: 'center' });
      
      // Save PDF
      doc.save(`Stundenaufstellung_${startDate}_${endDate}.pdf`);
      
      // Close dialog
      onClose();
    } catch (err) {
      console.error('Error generating PDF:', err);
      error = err instanceof Error ? err.message : 'Failed to generate PDF';
      loading = false;
    }
  }
  
  onMount(() => {
    generatePDF();
  });
</script>

{#if loading}
  <div class="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg p-6 shadow-xl">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green"></div>
        <p>PDF wird generiert...</p>
      </div>
    </div>
  </div>
{/if}

{#if error}
  <div class="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg p-6 shadow-xl max-w-md">
      <h3 class="text-lg font-semibold text-red-600 mb-2">Fehler beim PDF-Export</h3>
      <p class="text-sm text-ink/80 mb-4">{error}</p>
      <button
        on:click={onClose}
        class="px-4 py-2 bg-ink/10 text-ink rounded-md hover:bg-ink/20"
      >
        Schließen
      </button>
    </div>
  </div>
{/if}