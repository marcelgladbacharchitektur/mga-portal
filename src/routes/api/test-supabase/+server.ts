import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Test connection by checking if projects table exists
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (error) {
      return json({ 
        status: 'error',
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint || 'Make sure you have run the SQL schema in Supabase'
      }, { status: 500 });
    }
    
    return json({ 
      status: 'connected',
      message: 'Supabase connection successful',
      tableExists: true
    });
  } catch (error) {
    return json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: 'connection_error'
    }, { status: 500 });
  }
};