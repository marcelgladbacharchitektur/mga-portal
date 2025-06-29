import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const data = await request.json();
    const supabase = getSupabaseClient();
    
    const updateData = {
      name: data.name,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      company: data.company || null,
      type: data.type || null,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString()
    };
    
    const { data: contact, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return json({ error: 'Failed to update contact' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return json({ error: 'Failed to delete contact' }, { status: 500 });
  }
};