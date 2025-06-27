import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id, contactId } = params;
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('project_contacts')
      .delete()
      .eq('project_id', id)
      .eq('contact_id', contactId);
    
    if (error) throw error;
    
    return json({ success: true });
  } catch (error) {
    console.error('Error removing project contact:', error);
    return json({ error: 'Failed to remove project contact' }, { status: 500 });
  }
};