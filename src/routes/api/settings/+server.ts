import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

const SETTINGS_KEY = 'app_settings';

export const GET: RequestHandler = async () => {
  try {
    // Get settings from database
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error loading settings:', error);
      return json({ error: error.message }, { status: 500 });
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