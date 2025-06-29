import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('*')
      .order('invoice_date', { ascending: false });
    
    if (error) throw error;
    
    return json(receipts || []);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
};