import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const supabase = getSupabaseClient();
    
    // Get bank accounts with their transaction summaries
    const { data: bankAccounts, error } = await supabase
      .from('bank_accounts')
      .select(`
        *,
        bank_transactions (
          id,
          transaction_date,
          amount,
          transaction_type
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      // If table doesn't exist, return empty array
      if (error.message.includes('relation "bank_accounts" does not exist')) {
        console.log('Bank tables not created yet, returning empty array');
        return json([]);
      }
      throw error;
    }
    
    // Process bank accounts to include summary information
    const processedAccounts = bankAccounts?.map(account => {
      const transactions = account.bank_transactions || [];
      
      // Group transactions by month
      const transactionsByMonth = transactions.reduce((acc: any, transaction: any) => {
        const monthKey = transaction.transaction_date.substring(0, 7); // YYYY-MM
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            transactions: [],
            totalDebits: 0,
            totalCredits: 0,
            transactionCount: 0
          };
        }
        
        acc[monthKey].transactions.push(transaction);
        acc[monthKey].transactionCount++;
        
        if (transaction.amount < 0) {
          acc[monthKey].totalDebits += Math.abs(transaction.amount);
        } else {
          acc[monthKey].totalCredits += transaction.amount;
        }
        
        return acc;
      }, {});
      
      // Convert to array and sort by month
      const statements = Object.values(transactionsByMonth)
        .sort((a: any, b: any) => b.month.localeCompare(a.month))
        .map((statement: any) => {
          const sortedTransactions = statement.transactions
            .sort((a: any, b: any) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
          
          return {
            id: `${account.id}_${statement.month}`,
            bank_account_id: account.id,
            bank_name: account.bank_name || account.name,
            account_number: account.account_number,
            iban: account.iban,
            start_date: sortedTransactions[0]?.transaction_date,
            end_date: sortedTransactions[sortedTransactions.length - 1]?.transaction_date,
            transaction_count: statement.transactionCount,
            total_debits: statement.totalDebits,
            total_credits: statement.totalCredits,
            ending_balance: statement.totalCredits - statement.totalDebits
          };
        });
      
      return statements;
    }).flat();
    
    return json(processedAccounts || []);
  } catch (error: any) {
    console.error('Failed to load bank statements:', error);
    return json({ error: 'Failed to load bank statements' }, { status: 500 });
  }
};