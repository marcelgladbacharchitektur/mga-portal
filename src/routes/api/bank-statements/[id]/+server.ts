import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const data = await request.json();
    const supabase = getSupabaseClient();
    
    // Update the bank account
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only update fields that are provided
    if (data.bank_name !== undefined) updateData.bank_name = data.bank_name;
    if (data.name !== undefined) updateData.name = data.bank_name; // Also update name field
    if (data.account_number !== undefined) updateData.account_number = data.account_number;
    if (data.iban !== undefined) updateData.iban = data.iban;
    
    const { data: bankAccount, error } = await supabase
      .from('bank_accounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return json(bankAccount);
  } catch (error) {
    console.error('Error updating bank account:', error);
    return json({ error: 'Failed to update bank account' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();
    
    // First delete all transactions for this account
    const { error: transactionsError } = await supabase
      .from('bank_transactions')
      .delete()
      .eq('bank_account_id', id);
    
    if (transactionsError) {
      console.error('Error deleting transactions:', transactionsError);
      // Continue anyway, the account deletion might still work
    }
    
    // Then delete the bank account
    const { error: accountError } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);
    
    if (accountError) throw accountError;
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    return json({ error: 'Failed to delete bank account' }, { status: 500 });
  }
};