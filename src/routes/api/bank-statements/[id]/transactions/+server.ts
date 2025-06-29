import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();
    
    // Parse the composite ID (format: bankAccountId_YYYY-MM)
    const [bankAccountId, month] = id.split('_');
    
    if (!bankAccountId || !month) {
      return json({ error: 'Invalid statement ID' }, { status: 400 });
    }
    
    // Get transactions for the specified month
    const startDate = `${month}-01`;
    const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
      .toISOString().split('T')[0];
    
    const { data: transactions, error } = await supabase
      .from('bank_transactions')
      .select(`
        *,
        matched_receipt:receipts(*)
      `)
      .eq('bank_account_id', bankAccountId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });
    
    if (error) throw error;
    
    return json(transactions || []);
  } catch (error: any) {
    console.error('Failed to load transactions:', error);
    return json({ error: 'Failed to load transactions' }, { status: 500 });
  }
};