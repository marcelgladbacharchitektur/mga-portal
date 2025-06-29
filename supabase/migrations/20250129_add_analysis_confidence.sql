-- Add analysis_confidence column to receipts table
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS analysis_confidence DECIMAL(3,2) DEFAULT 0.0;