import { supabase } from './supabase';

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

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading settings:', error);
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

    cachedSettings = data?.value || defaultSettings;
    return cachedSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    // Return default settings on error
    return {
      drive_folders: {
        receipts: '100iNRjpLvKTywgWlDZxdrcTKynHN1tDP',
        receipts_archive: '100iNRjpLvKTywgWlDZxdrcTKynHN1tDP',
        bank_statements: '1vF8FGdYD4ROcgdmAggL1beLWQrmKXbyF',
        projects_root: ''
      }
    };
  }
}

export async function updateSettings(settings: AppSettings): Promise<void> {
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