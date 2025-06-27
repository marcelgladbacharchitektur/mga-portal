import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const accessToken = cookies.get('google_access_token');
    const refreshToken = cookies.get('google_refresh_token');
    
    if (!accessToken) {
      return json({ 
        authenticated: false,
        error: 'No access token found'
      });
    }
    
    // Initialize auth
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    
    // Get token info
    const oauth2 = google.oauth2({ version: 'v2', auth });
    const tokenInfo = await oauth2.tokeninfo();
    
    // Test Drive access by trying to get "About" info
    const drive = google.drive({ version: 'v3', auth });
    let driveAccess = false;
    let driveError = null;
    
    try {
      await drive.about.get({
        fields: 'user'
      });
      driveAccess = true;
    } catch (error: any) {
      driveError = {
        code: error.code,
        message: error.message
      };
    }
    
    return json({
      authenticated: true,
      tokenInfo: {
        scope: tokenInfo.data.scope,
        email: tokenInfo.data.email,
        expiresIn: tokenInfo.data.expires_in
      },
      driveAccess,
      driveError,
      scopes: tokenInfo.data.scope?.split(' ') || []
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return json({ 
      authenticated: false,
      error: error.message
    });
  }
};