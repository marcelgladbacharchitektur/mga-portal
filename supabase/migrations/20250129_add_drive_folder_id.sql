-- Add missing columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS drive_folder_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_id TEXT,
ADD COLUMN IF NOT EXISTS tasks_list_id TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_drive_folder_id ON projects(drive_folder_id);

-- Add comments
COMMENT ON COLUMN projects.drive_folder_id IS 'Google Drive folder ID for this project';
COMMENT ON COLUMN projects.calendar_id IS 'Google Calendar ID for this project';
COMMENT ON COLUMN projects.tasks_list_id IS 'Google Tasks list ID for this project';

-- Fix bank_transactions table if it exists
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'bank_transactions') THEN
        -- Add missing columns to bank_transactions
        ALTER TABLE bank_transactions 
        ADD COLUMN IF NOT EXISTS import_batch_id TEXT,
        ADD COLUMN IF NOT EXISTS raw_data JSONB;
        
        COMMENT ON COLUMN bank_transactions.import_batch_id IS 'Batch ID for bulk imports';
        COMMENT ON COLUMN bank_transactions.raw_data IS 'Raw transaction data from import';
    END IF;
END $$;