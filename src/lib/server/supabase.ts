import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export function getSupabaseClient() {
  const supabaseUrl = PUBLIC_SUPABASE_URL;
  const supabaseKey = SUPABASE_SERVICE_KEY || PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured. URL: ' + supabaseUrl + ', Key: ' + (supabaseKey ? 'set' : 'missing'));
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export type Project = {
  id?: string;
  project_id: string;
  name: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  client_id?: string;
  cadastral_community?: string;
  plot_area?: number;
  budget_hours?: number;
  drive_folder_url?: string;
  photos_album_url?: string;
  tasks_list_id?: string;
  calendar_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TimeEntry = {
  id?: string;
  project_id: string;
  date: string;
  duration_minutes: number;
  description?: string;
  billable: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Receipt = {
  id?: string;
  project_id?: string;
  invoice_date?: string;
  payment_date?: string;
  vendor: string;
  invoice_number?: string;
  amount: number;
  currency?: string;
  tax_amount?: number;
  payment_method?: string;
  category?: string;
  drive_file_id?: string;
  filename?: string;
  file_url?: string;
  analysis_confidence?: number;
  items?: string;
  created_at?: string;
  updated_at?: string;
};

export type Contact = {
  id?: string;
  name: string;
  company?: string;
  type?: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};