import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const POST: RequestHandler = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Run migrations for bank tables
    const migrations = [
      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        value JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      
      // Bank accounts table
      `CREATE TABLE IF NOT EXISTS bank_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        name TEXT NOT NULL,
        bank_name TEXT,
        account_number TEXT,
        iban TEXT,
        bic TEXT,
        currency TEXT DEFAULT 'EUR',
        initial_balance DECIMAL(10, 2) DEFAULT 0,
        active BOOLEAN DEFAULT true
      )`,
      
      // Bank transactions table
      `CREATE TABLE IF NOT EXISTS bank_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
        transaction_date DATE NOT NULL,
        booking_date DATE,
        amount DECIMAL(10, 2) NOT NULL,
        transaction_type TEXT,
        description TEXT,
        reference TEXT,
        category TEXT,
        counterparty_name TEXT,
        counterparty_account TEXT,
        notes TEXT,
        receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
        import_batch_id TEXT,
        raw_data JSONB
      )`,
      
      // Bank statements table
      `CREATE TABLE IF NOT EXISTS bank_statements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        drive_file_id TEXT,
        file_url TEXT,
        statement_date DATE,
        start_date DATE,
        end_date DATE,
        transaction_count INTEGER DEFAULT 0,
        total_debits DECIMAL(10, 2) DEFAULT 0,
        total_credits DECIMAL(10, 2) DEFAULT 0,
        opening_balance DECIMAL(10, 2),
        closing_balance DECIMAL(10, 2),
        processed BOOLEAN DEFAULT false,
        processing_errors JSONB
      )`,
      
      // Receipt transaction matches table
      `CREATE TABLE IF NOT EXISTS receipt_transaction_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
        transaction_id UUID REFERENCES bank_transactions(id) ON DELETE CASCADE,
        match_score DECIMAL(3, 2),
        match_reasons JSONB,
        status TEXT DEFAULT 'possible' CHECK (status IN ('possible', 'suggested', 'confirmed', 'rejected')),
        confirmed_by TEXT,
        confirmed_at TIMESTAMPTZ,
        UNIQUE(receipt_id, transaction_id)
      )`
    ];
    
    const errors = [];
    const successes = [];
    
    for (const migration of migrations) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: migration });
        if (error) {
          errors.push({ migration: migration.substring(0, 50) + '...', error: error.message });
        } else {
          successes.push(migration.substring(0, 50) + '...');
        }
      } catch (err: any) {
        errors.push({ migration: migration.substring(0, 50) + '...', error: err.message });
      }
    }
    
    // Also fix invalid currency values in receipts
    await supabase
      .from('receipts')
      .update({ currency: 'EUR' })
      .or('currency.eq.€,currency.is.null,currency.eq.');
    
    return json({ 
      success: true, 
      message: 'Migrations completed',
      successes,
      errors
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return json({ 
      error: 'Failed to run migrations',
      details: error.message 
    }, { status: 500 });
  }
};