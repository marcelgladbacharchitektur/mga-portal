-- Add first_name and last_name columns to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Migrate existing data by splitting the name field
-- This assumes names are in "FirstName LastName" format
UPDATE contacts 
SET 
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
    THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_contacts_first_name ON contacts(first_name);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name ON contacts(last_name);