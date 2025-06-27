import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', params.id);
    
    if (error) throw error;
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    return json({ error: 'Failed to delete time entry' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const supabase = getSupabaseClient();
    
    const { data: entry, error } = await supabase
      .from('time_entries')
      .update({
        project_id: data.project_id,
        date: data.date,
        duration_minutes: data.duration_minutes,
        description: data.description,
        billable: data.billable
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return json(entry);
  } catch (error) {
    console.error('Error updating time entry:', error);
    return json({ error: 'Failed to update time entry' }, { status: 500 });
  }
};