import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const folderId = url.searchParams.get('folderId');
    
    if (!folderId) {
      return json({ error: 'Folder ID required' }, { status: 400 });
    }
    
    // Get Google auth tokens
    const accessToken = cookies.get('google_access_token') || process.env.GOOGLE_ACCESS_TOKEN;
    const refreshToken = cookies.get('google_refresh_token') || process.env.GOOGLE_REFRESH_TOKEN;
    
    if (!accessToken) {
      // Return empty response if not authenticated
      return json({ 
        id: folderId,
        name: 'Nicht verbunden',
        url: null,
        authenticated: false
      });
    }
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    try {
      // Get folder metadata
      const response = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType, webViewLink, parents',
        supportsAllDrives: true
      });
      
      if (!response.data) {
        return json({ error: 'Folder not found' }, { status: 404 });
      }
      
      return json({
        id: response.data.id,
        name: response.data.name,
        url: response.data.webViewLink,
        parents: response.data.parents
      });
    } catch (driveError: any) {
      console.error('Drive API error:', driveError);
      
      if (driveError.code === 404) {
        return json({ error: 'Folder not found' }, { status: 404 });
      }
      
      if (driveError.code === 403) {
        return json({ error: 'No access to folder' }, { status: 403 });
      }
      
      throw driveError;
    }
  } catch (error: any) {
    console.error('Error getting folder info:', error);
    return json({ 
      error: 'Failed to get folder information',
      details: error.message 
    }, { status: 500 });
  }
};