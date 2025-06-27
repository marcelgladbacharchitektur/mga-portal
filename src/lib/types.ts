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
  project_id: string;
  invoice_date: string;
  payment_date?: string;
  vendor: string;
  invoice_number?: string;
  amount: number;
  filename?: string;
  file_url?: string;
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