-- Create settings table for storing app configuration
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