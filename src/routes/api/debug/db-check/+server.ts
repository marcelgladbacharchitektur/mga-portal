import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Check if tables exist
    const tableChecks = await Promise.all([
      supabase.from('bank_accounts').select('count', { count: 'exact' }).limit(0),
      supabase.from('bank_transactions').select('count', { count: 'exact' }).limit(0),
      supabase.from('financial_categories').select('count', { count: 'exact' }).limit(0),
      supabase.from('receipt_transaction_matches').select('count', { count: 'exact' }).limit(0),
      supabase.from('receipts').select('count', { count: 'exact' }).limit(0)
    ]);
    
    const results = {
      bank_accounts: { exists: !tableChecks[0].error, error: tableChecks[0].error?.message },
      bank_transactions: { exists: !tableChecks[1].error, error: tableChecks[1].error?.message },
      financial_categories: { exists: !tableChecks[2].error, error: tableChecks[2].error?.message },
      receipt_transaction_matches: { exists: !tableChecks[3].error, error: tableChecks[3].error?.message },
      receipts: { exists: !tableChecks[4].error, error: tableChecks[4].error?.message }
    };
    
    return json(results);
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};