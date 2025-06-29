import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';
import { SUPABASE_SERVICE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const GET: RequestHandler = async () => {
  try {
    // Debug environment variables
    const debug = {
      env: {
        PUBLIC_SUPABASE_URL: PUBLIC_SUPABASE_URL || 'NOT SET',
        PUBLIC_SUPABASE_ANON_KEY: PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
        SUPABASE_SERVICE_KEY: SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET'
      },
      tests: []
    };

    // Test 1: Can we create a Supabase client?
    try {
      const supabase = getSupabaseClient();
      debug.tests.push({ test: 'Create Supabase client', status: 'success' });
      
      // Test 2: Can we query the contacts table?
      try {
        const { data, error, count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact' })
          .limit(1);
        
        if (error) {
          debug.tests.push({ 
            test: 'Query contacts table', 
            status: 'failed',
            error: error.message,
            hint: error.hint,
            details: error.details
          });
        } else {
          debug.tests.push({ 
            test: 'Query contacts table', 
            status: 'success',
            totalContacts: count || 0
          });
        }
      } catch (queryError: any) {
        debug.tests.push({ 
          test: 'Query contacts table', 
          status: 'failed',
          error: queryError.message
        });
      }
      
      // Test 3: Check project_contacts table
      try {
        const { data, error } = await supabase
          .from('project_contacts')
          .select('*')
          .limit(1);
        
        if (error) {
          debug.tests.push({ 
            test: 'Query project_contacts table', 
            status: 'failed',
            error: error.message
          });
        } else {
          debug.tests.push({ 
            test: 'Query project_contacts table', 
            status: 'success'
          });
        }
      } catch (queryError: any) {
        debug.tests.push({ 
          test: 'Query project_contacts table', 
          status: 'failed',
          error: queryError.message
        });
      }
      
    } catch (clientError: any) {
      debug.tests.push({ 
        test: 'Create Supabase client', 
        status: 'failed',
        error: clientError.message
      });
    }
    
    return json(debug);
  } catch (error: any) {
    return json({ 
      error: 'Debug failed',
      message: error.message
    }, { status: 500 });
  }
};