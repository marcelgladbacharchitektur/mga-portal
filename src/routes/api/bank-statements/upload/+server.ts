import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analyzeBankStatement } from '$lib/server/bank-statement-analyzer';
import { getSupabaseClient } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
  console.log('Bank statement upload endpoint called');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('File received:', {
      name: file?.name,
      type: file?.type,
      size: file?.size
    });
    
    if (!file) {
      return json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Check file type
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      return json({ error: 'Invalid file type. Please upload a PDF or image file.' }, { status: 400 });
    }
    
    // Convert file to ArrayBuffer
    const buffer = await file.arrayBuffer();
    
    // Analyze with Gemini
    const analysis = await analyzeBankStatement(buffer, file.type);
    
    // Save to database
    const supabase = getSupabaseClient();
    
    // First, ensure we have a bank account
    let bankAccountId;
    if (analysis.iban || analysis.accountNumber) {
      const { data: existingAccount, error: checkError } = await supabase
        .from('bank_accounts')
        .select('id')
        .or(`iban.eq.${analysis.iban},account_number.eq.${analysis.accountNumber}`)
        .single();
      
      // If table doesn't exist, return error message
      if (checkError && checkError.message.includes('relation "bank_accounts" does not exist')) {
        return json({ 
          error: 'Datenbanktabellen fehlen noch. Bitte wenden Sie sich an den Administrator.',
          details: 'Die Tabellen für Kontoauszüge müssen erst angelegt werden.'
        }, { status: 503 });
      }
      
      if (existingAccount) {
        bankAccountId = existingAccount.id;
      } else {
        // Create new bank account
        const { data: newAccount, error: accountError } = await supabase
          .from('bank_accounts')
          .insert([{
            name: 'Hauptkonto',
            account_number: analysis.accountNumber,
            iban: analysis.iban
          }])
          .select()
          .single();
        
        if (accountError) throw accountError;
        bankAccountId = newAccount?.id;
      }
    }
    
    // Save transactions
    const transactionsToInsert = analysis.transactions.map(transaction => ({
      bank_account_id: bankAccountId,
      transaction_date: transaction.date,
      amount: transaction.amount,
      description: transaction.description,
      reference: transaction.reference,
      counterparty_name: transaction.counterparty,
      transaction_type: transaction.type,
      import_batch_id: `upload_${Date.now()}`,
      raw_data: transaction
    }));
    
    const { data: insertedTransactions, error } = await supabase
      .from('bank_transactions')
      .insert(transactionsToInsert)
      .select();
    
    if (error) throw error;
    
    // Try to match transactions with receipts
    for (const transaction of insertedTransactions || []) {
      // Look for receipts with similar amounts and dates
      const { data: potentialMatches } = await supabase
        .from('receipts')
        .select('*')
        .gte('invoice_date', new Date(new Date(transaction.transaction_date).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lte('invoice_date', new Date(new Date(transaction.transaction_date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .gte('amount', Math.abs(transaction.amount) * 0.95)
        .lte('amount', Math.abs(transaction.amount) * 1.05);
      
      if (potentialMatches && potentialMatches.length > 0) {
        // Create match suggestions
        for (const receipt of potentialMatches) {
          const matchScore = calculateMatchScore(transaction, receipt);
          
          await supabase
            .from('receipt_transaction_matches')
            .insert([{
              receipt_id: receipt.id,
              transaction_id: transaction.id,
              match_score: matchScore,
              match_reasons: {
                amount_match: Math.abs(1 - Math.abs(transaction.amount) / receipt.amount),
                date_proximity: 1 - Math.abs(new Date(transaction.transaction_date).getTime() - new Date(receipt.invoice_date).getTime()) / (7 * 24 * 60 * 60 * 1000),
                vendor_match: transaction.description?.toLowerCase().includes(receipt.vendor.toLowerCase()) ? 1 : 0
              },
              status: matchScore > 0.8 ? 'suggested' : 'possible'
            }]);
        }
      }
    }
    
    return json({ 
      success: true,
      analysis,
      transactionsCount: insertedTransactions?.length || 0,
      bankAccountId
    });
  } catch (error: any) {
    console.error('Bank statement upload error:', error);
    return json({ 
      error: 'Failed to analyze bank statement',
      details: error.message 
    }, { status: 500 });
  }
};

function calculateMatchScore(transaction: any, receipt: any): number {
  let score = 0;
  let factors = 0;
  
  // Amount match (40% weight)
  const amountDiff = Math.abs(Math.abs(transaction.amount) - receipt.amount) / receipt.amount;
  score += (1 - amountDiff) * 0.4;
  factors += 0.4;
  
  // Date proximity (40% weight)
  const daysDiff = Math.abs(new Date(transaction.transaction_date).getTime() - new Date(receipt.invoice_date).getTime()) / (24 * 60 * 60 * 1000);
  const dateScore = Math.max(0, 1 - daysDiff / 7); // 0 score after 7 days
  score += dateScore * 0.4;
  factors += 0.4;
  
  // Vendor match (20% weight)
  if (transaction.description && receipt.vendor) {
    const vendorMatch = transaction.description.toLowerCase().includes(receipt.vendor.toLowerCase()) ||
                       receipt.vendor.toLowerCase().includes(transaction.counterparty_name?.toLowerCase() || '');
    score += vendorMatch ? 0.2 : 0;
    factors += 0.2;
  }
  
  return score / factors;
}