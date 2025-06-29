import { getSupabaseClient } from './supabase';

const SETTINGS_KEY = 'app_settings';

export interface AppSettings {
  drive_folders: {
    receipts: string;
    receipts_archive: string;
    bank_statements: string;
    projects_root: string;
  };
}

let cachedSettings: AppSettings | null = null;

export async function getSettings(): Promise<AppSettings> {
  // Return cached settings if available
  if (cachedSettings) {
    return cachedSettings;
  }

  // Default settings
  const defaultSettings: AppSettings = {
    drive_folders: {
      receipts: '100iNRjpLvKTywgWlDZxdrcTKynHN1tDP',
      receipts_archive: '100iNRjpLvKTywgWlDZxdrcTKynHN1tDP',
      bank_statements: '1vF8FGdYD4ROcgdmAggL1beLWQrmKXbyF',
      projects_root: ''
    }
  };

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    if (error) {
      if (error.code !== 'PGRST116' && !error.message.includes('relation "settings" does not exist')) {
        console.error('Error loading settings:', error);
      }
      cachedSettings = defaultSettings;
      return cachedSettings;
    }

    cachedSettings = data?.value || defaultSettings;
    return cachedSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    cachedSettings = defaultSettings;
    return cachedSettings;
  }
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('settings')
    .upsert({
      key: SETTINGS_KEY,
      value: settings,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'key'
    });

  if (error) {
    throw error;
  }

  // Update cache
  cachedSettings = settings;
}

export function clearSettingsCache(): void {
  cachedSettings = null;
}