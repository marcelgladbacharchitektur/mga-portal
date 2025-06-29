-- Add missing columns to receipts table
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS drive_file_url TEXT,
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS analysis_confidence NUMERIC,
ADD COLUMN IF NOT EXISTS items JSONB,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- Add index for drive_file_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_receipts_drive_file_id ON receipts(drive_file_id);