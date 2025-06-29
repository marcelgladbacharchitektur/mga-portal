-- Financial Management Schema Extensions

-- Bank Accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255),
  account_number VARCHAR(50),
  iban VARCHAR(50),
  bic VARCHAR(20),
  currency VARCHAR(10) DEFAULT 'EUR',
  balance NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bank Transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  value_date DATE,
  amount NUMERIC NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  reference VARCHAR(500),
  description TEXT,
  counterparty_name VARCHAR(255),
  counterparty_account VARCHAR(100),
  transaction_type VARCHAR(50), -- debit, credit, fee, interest
  category VARCHAR(100),
  matched_receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  matching_status VARCHAR(20) DEFAULT 'unmatched', -- unmatched, suggested, confirmed, ignored
  matching_confidence NUMERIC,
  import_batch_id VARCHAR(100),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial Categories table
CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- income, expense
  parent_id UUID REFERENCES financial_categories(id) ON DELETE CASCADE,
  tax_relevant BOOLEAN DEFAULT false,
  vat_rate NUMERIC,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Receipt-Transaction Matches table (for tracking match history)
CREATE TABLE IF NOT EXISTS receipt_transaction_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
  match_score NUMERIC,
  match_reasons JSONB, -- {amount_match: 0.95, date_match: 0.8, vendor_match: 0.7}
  status VARCHAR(20) NOT NULL, -- suggested, confirmed, rejected
  confirmed_by VARCHAR(255),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(receipt_id, transaction_id)
);

-- Update receipts table
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS matched_transaction_id UUID REFERENCES bank_transactions(id) ON DELETE SET NULL;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS matching_status VARCHAR(20) DEFAULT 'unmatched';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS financial_category_id UUID REFERENCES financial_categories(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_amount ON bank_transactions(amount);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_matching_status ON bank_transactions(matching_status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_receipt_matches_receipt ON receipt_transaction_matches(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_matches_transaction ON receipt_transaction_matches(transaction_id);

-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_transaction_matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations for authenticated users" ON bank_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON bank_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON financial_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON receipt_transaction_matches
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default financial categories
INSERT INTO financial_categories (name, type, tax_relevant, sort_order) VALUES
  ('Einnahmen', 'income', true, 1),
  ('Honorare', 'income', true, 11),
  ('Sonstige Einnahmen', 'income', true, 12),
  
  ('Ausgaben', 'expense', true, 2),
  ('Büromaterial', 'expense', true, 21),
  ('Werkzeug & Geräte', 'expense', true, 22),
  ('Software & Lizenzen', 'expense', true, 23),
  ('Reisekosten', 'expense', true, 24),
  ('Fortbildung', 'expense', true, 25),
  ('Versicherungen', 'expense', true, 26),
  ('Kommunikation', 'expense', true, 27),
  ('Miete & Nebenkosten', 'expense', true, 28),
  ('Fahrzeugkosten', 'expense', true, 29),
  ('Marketing & Werbung', 'expense', true, 30),
  ('Beratung & Rechtskosten', 'expense', true, 31),
  ('Bankgebühren', 'expense', false, 32),
  ('Sonstige Ausgaben', 'expense', true, 39)
ON CONFLICT DO NOTHING;