-- Ensure receipts table has all required columns
-- Add missing columns if they don't exist

-- First ensure the table exists
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add columns one by one if they don't exist
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS invoice_date DATE;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS vendor VARCHAR(255) NOT NULL DEFAULT 'Unknown';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EUR';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tax_amount NUMERIC;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(255);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS filename VARCHAR(255);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS analysis_confidence NUMERIC DEFAULT 0.0;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS items JSONB;

-- Remove NOT NULL constraint from vendor if it exists (temporarily)
ALTER TABLE receipts ALTER COLUMN vendor DROP NOT NULL;
UPDATE receipts SET vendor = 'Unknown' WHERE vendor IS NULL;
ALTER TABLE receipts ALTER COLUMN vendor SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_receipts_project_id ON receipts(project_id);
CREATE INDEX IF NOT EXISTS idx_receipts_vendor ON receipts(vendor);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_date ON receipts(invoice_date);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);

-- Enable RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policy
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON receipts;
CREATE POLICY "Enable all operations for authenticated users" ON receipts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);