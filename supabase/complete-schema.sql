-- Complete database schema for MGA Portal

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  client VARCHAR(255),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  cadastral_community VARCHAR(255),
  plot_area NUMERIC,
  budget_hours NUMERIC,
  drive_folder_url TEXT,
  photos_album_url TEXT,
  tasks_list_id VARCHAR(255),
  calendar_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  type VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project contacts junction table (already created)
-- CREATE TABLE IF NOT EXISTS project_contacts ...

-- Time entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Receipts table (optional)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  invoice_date DATE,
  payment_date DATE,
  vendor VARCHAR(255),
  invoice_number VARCHAR(100),
  amount NUMERIC,
  filename VARCHAR(255),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_project_id ON projects(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_receipts_project_id ON receipts(project_id);

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for authenticated users)
CREATE POLICY "Enable all operations for authenticated users" ON projects
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON contacts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON time_entries
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON receipts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: For production, you should use more restrictive RLS policies!