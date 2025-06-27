-- Create junction table for project-contact relationships
CREATE TABLE IF NOT EXISTS project_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role VARCHAR(50), -- e.g., 'bauherr', 'architekt', 'statiker', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique project-contact pairs
  UNIQUE(project_id, contact_id)
);

-- Create indexes for better performance
CREATE INDEX idx_project_contacts_project_id ON project_contacts(project_id);
CREATE INDEX idx_project_contacts_contact_id ON project_contacts(contact_id);

-- Enable RLS
ALTER TABLE project_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations for authenticated users" ON project_contacts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);