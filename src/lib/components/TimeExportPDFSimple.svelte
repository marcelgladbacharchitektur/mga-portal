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
      const { jsPDF } = await import('jspdf');
      
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
      
      // Table header
      let yPosition = 45;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(90, 97, 75); // accent-green
      doc.rect(14, yPosition - 5, 182, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('Datum', 16, yPosition);
      doc.text('Projekt', 42, yPosition);
      doc.text('Beschreibung', 82, yPosition);
      doc.text('Stunden', 162, yPosition, { align: 'right' });
      doc.text('Abr.', 186, yPosition, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      yPosition += 10;
      
      // Table rows
      let totalHours = 0;
      let billableHours = 0;
      
      entries.forEach((entry, index) => {
        const date = new Date(entry.date).toLocaleDateString('de-AT');
        const hours = (entry.duration_minutes / 60).toFixed(2);
        const project = entry.project?.name || 'Unbekannt';
        const description = entry.description || '-';
        const billable = entry.billable ? 'Ja' : 'Nein';
        
        totalHours += entry.duration_minutes / 60;
        if (entry.billable) {
          billableHours += entry.duration_minutes / 60;
        }
        
        // Alternate row background
        if (index % 2 === 1) {
          doc.setFillColor(245, 245, 245);
          doc.rect(14, yPosition - 4, 182, 6, 'F');
        }
        
        // Draw row
        doc.text(date, 16, yPosition);
        doc.text(project.substring(0, 20), 42, yPosition);
        doc.text(description.substring(0, 40), 82, yPosition);
        doc.text(hours, 162, yPosition, { align: 'right' });
        doc.text(billable, 186, yPosition, { align: 'center' });
        
        yPosition += 6;
        
        // Add new page if needed
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }
      });
      
      // Summary
      yPosition += 10;
      doc.setFont(undefined, 'bold');
      doc.text(`Gesamt: ${totalHours.toFixed(2)} Stunden`, 14, yPosition);
      doc.text(`Abrechenbar: ${billableHours.toFixed(2)} Stunden`, 14, yPosition + 6);
      
      // Footer
      doc.setFont(undefined, 'normal');
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