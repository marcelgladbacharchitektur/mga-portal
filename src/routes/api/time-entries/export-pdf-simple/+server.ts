import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const projectId = url.searchParams.get('projectId');
    
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
    
    // Create simple HTML content
    const startDate = new Date(start).toLocaleDateString('de-AT');
    const endDate = new Date(end).toLocaleDateString('de-AT');
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Stundenaufstellung ${startDate} - ${endDate}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; }
    h1 { color: #5A614B; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #5A614B; color: white; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .summary { margin-top: 20px; padding: 15px; background-color: #f0f0f0; }
    .footer { margin-top: 40px; text-align: center; font-size: 0.9em; color: #666; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>Stundenaufstellung</h1>
  <p>Zeitraum: ${startDate} - ${endDate}</p>
  
  <table>
    <thead>
      <tr>
        <th>Datum</th>
        <th>Projekt</th>
        <th>Beschreibung</th>
        <th style="text-align: right;">Stunden</th>
        <th style="text-align: center;">Abrechenbar</th>
      </tr>
    </thead>
    <tbody>`;
    
    let totalHours = 0;
    let billableHours = 0;
    
    entries?.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString('de-AT');
      const hours = (entry.duration_minutes / 60).toFixed(2);
      const project = entry.project?.name || 'Unbekannt';
      const description = entry.description || '-';
      const billable = entry.billable ? 'Ja' : 'Nein';
      
      totalHours += entry.duration_minutes / 60;
      if (entry.billable) {
        billableHours += entry.duration_minutes / 60;
      }
      
      html += `
      <tr>
        <td>${date}</td>
        <td>${project}</td>
        <td>${description}</td>
        <td style="text-align: right;">${hours}</td>
        <td style="text-align: center;">${billable}</td>
      </tr>`;
    });
    
    html += `
    </tbody>
  </table>
  
  <div class="summary">
    <p><strong>Gesamt:</strong> ${totalHours.toFixed(2)} Stunden</p>
    <p><strong>Abrechenbar:</strong> ${billableHours.toFixed(2)} Stunden</p>
  </div>
  
  <div class="footer">
    <p>Erstellt am: ${new Date().toLocaleDateString('de-AT')}</p>
    <p>Marcel Gladbach Architektur</p>
  </div>
  
  <div class="no-print" style="margin-top: 40px;">
    <button onclick="window.print()" style="padding: 10px 20px; background-color: #5A614B; color: white; border: none; cursor: pointer;">
      Als PDF drucken
    </button>
  </div>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Stundenaufstellung_${startDate}_${endDate}.html"`
      }
    });
  } catch (error) {
    console.error('Error generating export:', error);
    return json({ error: 'Failed to generate export' }, { status: 500 });
  }
};