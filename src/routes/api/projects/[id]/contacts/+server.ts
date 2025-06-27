import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();
    
    // Get contacts associated with this project
    const { data, error } = await supabase
      .from('project_contacts')
      .select(`
        role,
        contacts (
          id,
          name,
          company,
          type,
          email,
          phone,
          notes
        )
      `)
      .eq('project_id', id);
    
    if (error) throw error;
    
    // Flatten the data structure
    const contacts = data?.map(item => ({
      ...item.contacts,
      role: item.role
    })) || [];
    
    return json(contacts);
  } catch (error) {
    console.error('Error fetching project contacts:', error);
    return json({ error: 'Failed to fetch project contacts' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const { contact_id, role } = await request.json();
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('project_contacts')
      .insert([{
        project_id: id,
        contact_id,
        role
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return json(data);
  } catch (error) {
    console.error('Error adding project contact:', error);
    return json({ error: 'Failed to add project contact' }, { status: 500 });
  }
};