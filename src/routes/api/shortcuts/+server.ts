import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';
import { API_TOKEN } from '$env/static/private';

// Special endpoint for Apple Shortcuts
export const POST: RequestHandler = async ({ request, url }) => {
  try {
    // Validate API token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  url.searchParams.get('token');
    
    if (API_TOKEN && token !== API_TOKEN) {
      return json({ error: 'Invalid API token' }, { status: 401 });
    }
    
    const data = await request.json();
    const action = data.action || url.searchParams.get('action');
    
    const supabase = getSupabaseClient();
    
    switch (action) {
      case 'log_time': {
        // Log time entry
        const { project_name, project_id, duration_minutes, description } = data;
        
        // Find project by name or ID
        let projectQuery = supabase.from('projects').select('id');
        if (project_id) {
          projectQuery = projectQuery.eq('project_id', project_id);
        } else if (project_name) {
          projectQuery = projectQuery.ilike('name', `%${project_name}%`);
        } else {
          return json({ error: 'Project name or ID required' }, { status: 400 });
        }
        
        const { data: projects } = await projectQuery.single();
        if (!projects) {
          return json({ error: 'Project not found' }, { status: 404 });
        }
        
        // Create time entry
        const { data: entry, error } = await supabase
          .from('time_entries')
          .insert([{
            project_id: projects.id,
            date: new Date().toISOString(),
            duration_minutes: duration_minutes || 30,
            description: description || 'Via Shortcuts',
            billable: true
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        return json({
          success: true,
          message: `Zeit erfasst: ${duration_minutes || 30} Minuten`,
          entry
        });
      }
      
      case 'create_note': {
        // Create a note (as contact note or project note)
        const { project_name, project_id, note } = data;
        
        // Find project
        let projectQuery = supabase.from('projects').select('id, name');
        if (project_id) {
          projectQuery = projectQuery.eq('project_id', project_id);
        } else if (project_name) {
          projectQuery = projectQuery.ilike('name', `%${project_name}%`);
        }
        
        const { data: project } = await projectQuery.single();
        
        // For now, create as a time entry with 0 minutes
        const { data: entry, error } = await supabase
          .from('time_entries')
          .insert([{
            project_id: project?.id,
            date: new Date().toISOString(),
            duration_minutes: 0,
            description: `[NOTIZ] ${note}`,
            billable: false
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        return json({
          success: true,
          message: 'Notiz erstellt',
          entry
        });
      }
      
      case 'list_projects': {
        // List active projects
        const { data: projects, error } = await supabase
          .from('projects')
          .select('project_id, name, status')
          .eq('status', 'ACTIVE')
          .order('project_id', { ascending: false });
        
        if (error) throw error;
        
        return json({
          success: true,
          projects: projects?.map(p => ({
            id: p.project_id,
            name: p.name,
            display: `${p.project_id} - ${p.name}`
          }))
        });
      }
      
      case 'today_summary': {
        // Get today's time summary
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { data: entries, error } = await supabase
          .from('time_entries')
          .select(`
            duration_minutes,
            description,
            project:projects(project_id, name)
          `)
          .gte('date', today.toISOString())
          .lt('date', tomorrow.toISOString());
        
        if (error) throw error;
        
        const totalMinutes = entries?.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0;
        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        
        const summary = entries?.reduce((acc: any, entry) => {
          const key = entry.project?.project_id || 'Unbekannt';
          if (!acc[key]) {
            acc[key] = {
              name: entry.project?.name || 'Unbekannt',
              minutes: 0,
              tasks: []
            };
          }
          acc[key].minutes += entry.duration_minutes || 0;
          if (entry.description) {
            acc[key].tasks.push(entry.description);
          }
          return acc;
        }, {});
        
        return json({
          success: true,
          date: today.toISOString().split('T')[0],
          total: `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`,
          totalMinutes,
          projects: Object.entries(summary || {}).map(([id, data]: any) => ({
            id,
            name: data.name,
            time: `${Math.floor(data.minutes / 60)}:${(data.minutes % 60).toString().padStart(2, '0')}`,
            tasks: data.tasks
          }))
        });
      }
      
      default:
        return json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Shortcuts API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};