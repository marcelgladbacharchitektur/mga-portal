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
    let driveUser = null;
    
    try {
      const aboutResponse = await drive.about.get({
        fields: 'user(displayName, emailAddress, photoLink)'
      });
      driveAccess = true;
      driveUser = aboutResponse.data.user;
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
      driveUser,
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