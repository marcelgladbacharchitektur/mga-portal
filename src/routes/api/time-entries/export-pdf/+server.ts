import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';
import pkg from 'jspdf';
const { jsPDF } = pkg;
import 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const projectId = url.searchParams.get('projectId');
    
    console.log('PDF Export Request:', { start, end, projectId });
    
    if (!start || !end) {
      return json({ error: 'Start and end dates required' }, { status: 400 });
    }
    
    const supabase = getSupabaseClient();
    
    // Build query
    let query = supabase
      .from('time_entries')
      .select(`
        *,
        project:projects(id, project_id, name)
      `)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data: entries, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    console.log('Time entries found:', entries?.length || 0);
    
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
    const tableData = entries?.map(entry => {
      const date = new Date(entry.date).toLocaleDateString('de-AT');
      const hours = (entry.duration_minutes / 60).toFixed(2);
      const project = entry.project?.name || 'Unbekannt';
      const description = entry.description || '-';
      const billable = entry.billable ? 'Ja' : 'Nein';
      
      return [date, project, description, hours, billable];
    }) || [];
    
    // Add table
    doc.autoTable({
      head: [['Datum', 'Projekt', 'Beschreibung', 'Stunden', 'Abrechenbar']],
      body: tableData,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [90, 97, 75] }, // Using accent-green color
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 80 },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' }
      }
    });
    
    // Summary
    const totalHours = entries?.reduce((sum, e) => sum + (e.duration_minutes / 60), 0) || 0;
    const billableHours = entries?.filter(e => e.billable).reduce((sum, e) => sum + (e.duration_minutes / 60), 0) || 0;
    
    const finalY = doc.lastAutoTable?.finalY || 50;
    doc.setFontSize(10);
    doc.text(`Gesamt: ${totalHours.toFixed(2)} Stunden`, 14, finalY + 10);
    doc.text(`Abrechenbar: ${billableHours.toFixed(2)} Stunden`, 14, finalY + 16);
    
    // Footer
    doc.setFontSize(8);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-AT')}`, 14, 280);
    doc.text('Marcel Gladbach Architektur', 105, 280, { align: 'center' });
    
    // Generate PDF
    const pdfOutput = doc.output('arraybuffer');
    
    return new Response(pdfOutput, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Stundenaufstellung_${startDate}_${endDate}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
};