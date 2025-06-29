import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    // Get tokens from cookies or environment
    let accessToken = cookies.get('google_access_token') || process.env.GOOGLE_ACCESS_TOKEN;
    let refreshToken = cookies.get('google_refresh_token') || process.env.GOOGLE_REFRESH_TOKEN;
    
    if (!accessToken) {
      return json({ 
        error: 'Not authenticated',
        hasAccessToken: false,
        hasCookieToken: !!cookies.get('google_access_token'),
        hasEnvToken: !!process.env.GOOGLE_ACCESS_TOKEN
      }, { status: 401 });
    }
    
    // Initialize auth
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    // Try to list files (simple test)
    const response = await drive.files.list({
      pageSize: 1,
      fields: 'files(id, name)'
    });
    
    return json({
      success: true,
      authenticated: true,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      tokenSource: cookies.get('google_access_token') ? 'cookies' : 'environment',
      testResult: {
        filesFound: response.data.files?.length || 0,
        firstFile: response.data.files?.[0]?.name || 'No files'
      }
    });
    
  } catch (error: any) {
    console.error('Drive test error:', error);
    
    return json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.response?.data || 'No additional details'
    }, { status: 500 });
  }
};