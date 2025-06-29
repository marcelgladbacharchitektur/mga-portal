import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const supabase = getSupabaseClient();
    
    // First check if bank_accounts table exists
    const { error: checkError } = await supabase
      .from('bank_accounts')
      .select('id')
      .limit(1);
    
    if (checkError) {
      if (checkError.message.includes('relation "bank_accounts" does not exist')) {
        console.log('Bank tables not created yet, returning empty array');
        return json([]);
      }
      // Other errors, log but continue
      console.error('Error checking bank_accounts:', checkError);
      return json([]);
    }
    
    // Get bank accounts first
    const { data: bankAccounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (accountsError) {
      console.error('Error loading bank accounts:', accountsError);
      return json([]);
    }
    
    // Get transactions separately to avoid relationship conflicts
    const { data: allTransactions, error: transactionsError } = await supabase
      .from('bank_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });
    
    const error = transactionsError;
    
    if (error) {
      console.error('Error loading bank accounts:', error);
      return json([]);
    }
    
    // If no bank accounts exist, return empty array
    if (!bankAccounts || bankAccounts.length === 0) {
      return json([]);
    }
    
    // Process bank accounts to include summary information
    try {
      const processedAccounts = bankAccounts.flatMap(account => {
        // Filter transactions for this account
        const transactions = allTransactions?.filter(t => t.bank_account_id === account.id) || [];
        
        if (transactions.length === 0) {
          // Return a single statement for accounts without transactions
          return [{
            id: `${account.id}_empty`,
            bank_account_id: account.id,
            bank_name: account.bank_name || account.name,
            account_number: account.account_number,
            iban: account.iban,
            start_date: null,
            end_date: null,
            transaction_count: 0,
            total_debits: 0,
            total_credits: 0,
            ending_balance: 0
          }];
        }
        
        // Group transactions by month
        const transactionsByMonth = transactions.reduce((acc: any, transaction: any) => {
          if (!transaction || !transaction.transaction_date) return acc;
          
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
      });
      
      return json(processedAccounts || []);
    } catch (processingError) {
      console.error('Error processing bank accounts:', processingError);
      return json([]);
    }
  } catch (error: any) {
    console.error('Failed to load bank statements:', error);
    return json([]);
  }
};