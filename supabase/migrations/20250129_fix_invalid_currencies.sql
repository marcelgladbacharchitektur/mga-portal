-- Fix invalid currency values
UPDATE receipts 
SET currency = 'EUR' 
WHERE currency = '€' OR currency IS NULL OR currency = '';

-- Ensure currency has a default value
ALTER TABLE receipts 
ALTER COLUMN currency SET DEFAULT 'EUR';