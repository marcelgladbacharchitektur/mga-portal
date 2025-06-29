-- Add Google Photos album ID field to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS photos_album_id TEXT;

-- Add comment explaining the field
COMMENT ON COLUMN projects.photos_album_id IS 'Google Photos shared album ID for project photos';