import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return json(contacts || []);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const supabase = getSupabaseClient();
    
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert([{
        name: data.name,
        company: data.company || null,
        type: data.type || null,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    return json({ error: 'Failed to create contact' }, { status: 500 });
  }
};