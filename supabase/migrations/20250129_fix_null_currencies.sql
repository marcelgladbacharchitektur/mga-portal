-- Fix any NULL currency values in existing receipts
-- Set them to 'EUR' as the default currency
UPDATE receipts 
SET currency = 'EUR' 
WHERE currency IS NULL OR currency = '';

-- Ensure currency column has NOT NULL constraint with default
ALTER TABLE receipts ALTER COLUMN currency SET DEFAULT 'EUR';
ALTER TABLE receipts ALTER COLUMN currency SET NOT NULL;