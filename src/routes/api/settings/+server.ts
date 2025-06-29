import { json } from '@sveltejs/kit';
import { getSupabaseClient } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

const SETTINGS_KEY = 'app_settings';

export const GET: RequestHandler = async () => {
  try {
    // Get settings from database
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    if (error) {
      // If table doesn't exist or no rows found, return defaults
      if (error.code === 'PGRST116' || error.message.includes('relation "settings" does not exist')) {
        console.log('Settings table not found or empty, returning defaults');
      } else {
        console.error('Error loading settings:', error);
      }
    }

    // Return settings or default values
    const defaultSettings = {
      drive_folders: {
        receipts: '100iNRjpLvKTywgWlDZxdrcTKynHN1tDP',
        receipts_archive: '100iNRjpLvKTywgWlDZxdrcTKynHN1tDP',
        bank_statements: '1vF8FGdYD4ROcgdmAggL1beLWQrmKXbyF',
        projects_root: ''
      }
    };

    return json(data?.value || defaultSettings);
  } catch (error) {
    console.error('Error loading settings:', error);
    return json({ error: 'Failed to load settings' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const settings = await request.json();
    const supabase = getSupabaseClient();

    // First, try to create the table if it doesn't exist
    try {
      // Check if table exists by trying to select from it
      const { error: checkError } = await supabase
        .from('settings')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.message.includes('relation "settings" does not exist')) {
        console.log('Settings table does not exist yet');
        return json({ 
          error: 'Settings table not created yet. Please run database migrations.',
          requiresMigration: true 
        }, { status: 503 });
      }
    } catch (e) {
      console.error('Error checking table:', e);
    }

    // Upsert settings
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
      console.error('Error saving settings:', error);
      return json({ error: error.message }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return json({ error: 'Failed to save settings' }, { status: 500 });
  }
};