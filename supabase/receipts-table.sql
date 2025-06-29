-- Create receipts table if not exists
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  invoice_date DATE,
  payment_date DATE,
  vendor VARCHAR(255) NOT NULL,
  invoice_number VARCHAR(100),
  amount NUMERIC NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  tax_amount NUMERIC,
  payment_method VARCHAR(50),
  category VARCHAR(50),
  drive_file_id VARCHAR(255),
  filename VARCHAR(255),
  file_url TEXT,
  analysis_confidence NUMERIC,
  items JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_receipts_project_id ON receipts(project_id);
CREATE INDEX IF NOT EXISTS idx_receipts_vendor ON receipts(vendor);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_date ON receipts(invoice_date);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);

-- Enable RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Enable all operations for authenticated users" ON receipts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);