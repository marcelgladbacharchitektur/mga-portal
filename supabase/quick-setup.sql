-- Quick setup script for MGA Portal
-- Run this in Supabase SQL Editor to create all necessary tables

-- 1. Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS settings_key_idx ON settings(key);

-- Insert default settings
INSERT INTO settings (key, value) 
VALUES ('app_settings', '{
  "drive_folders": {
    "receipts": "100iNRjpLvKTywgWlDZxdrcTKynHN1tDP",
    "receipts_archive": "100iNRjpLvKTywgWlDZxdrcTKynHN1tDP",
    "bank_statements": "1vF8FGdYD4ROcgdmAggL1beLWQrmKXbyF",
    "projects_root": ""
  }
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Fix any invalid currency values in receipts
UPDATE receipts 
SET currency = 'EUR' 
WHERE currency = '€' OR currency IS NULL OR currency = '';

-- 3. Create bank tables (optional - only if you want to use bank statements)
CREATE TABLE IF NOT EXISTS bank_accounts (
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
);

CREATE TABLE IF NOT EXISTS bank_transactions (
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
);

CREATE TABLE IF NOT EXISTS bank_statements (
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
);

CREATE TABLE IF NOT EXISTS receipt_transaction_matches (
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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_statements_account_id ON bank_statements(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_statements_date ON bank_statements(statement_date);
CREATE INDEX IF NOT EXISTS idx_receipt_matches_receipt ON receipt_transaction_matches(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_matches_transaction ON receipt_transaction_matches(transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipt_matches_status ON receipt_transaction_matches(status);

-- Done! You can now use the settings page and all features.