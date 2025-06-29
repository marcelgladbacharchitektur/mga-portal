import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const date = url.searchParams.get('date');
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const projectId = url.searchParams.get('project_id');
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('time_entries')
      .select(`
        *,
        project:projects(id, project_id, name)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query = query
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
    } else if (start && end) {
      // Date range filtering
      query = query
        .gte('date', start)
        .lte('date', end);
    }
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data: entries, error } = await query;
    
    if (error) throw error;
    
    // Transform to include project_name at top level
    const transformedEntries = entries?.map(entry => ({
      ...entry,
      project_name: entry.project?.name || ''
    })) || [];
    
    return json(transformedEntries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return json({ error: 'Failed to fetch time entries' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, url }) => {
  try {
    const data = await request.json();
    const supabase = getSupabaseClient();
    
    // Support for Apple Shortcuts - check for API token
    const apiToken = url.searchParams.get('token') || request.headers.get('X-API-Token');
    if (apiToken) {
      // Validate token here if needed
      // For now, we'll accept any token
    }
    
    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert([{
        project_id: data.project_id,
        date: data.date || new Date().toISOString(),
        duration_minutes: data.duration_minutes,
        description: data.description || null,
        billable: data.billable ?? true
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return json(entry);
  } catch (error) {
    console.error('Error creating time entry:', error);
    return json({ error: 'Failed to create time entry' }, { status: 500 });
  }
};