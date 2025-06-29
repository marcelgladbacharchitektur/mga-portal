import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ params, cookies }) => {
  try {
    const projectId = params.id;
    const supabase = getSupabaseClient();

    // Fetch time entries for the project
    const { data: entries, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (error) throw error;

    // Transform the data to match the expected format
    const timeEntries = entries?.map(entry => ({
      id: entry.id,
      date: entry.date,
      duration_minutes: entry.duration_minutes,
      description: entry.description
    })) || [];

    return json(timeEntries);
  } catch (error: any) {
    console.error('Error fetching time entries:', error);
    return json({ error: 'Failed to fetch time entries' }, { status: 500 });
  }
};