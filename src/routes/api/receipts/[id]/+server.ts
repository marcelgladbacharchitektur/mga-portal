import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  try {
    const fileId = params.id;
    
    // Get Google auth tokens
    const accessToken = cookies.get('google_access_token');
    const refreshToken = cookies.get('google_refresh_token');
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    // Move file to trash
    await drive.files.update({
      fileId,
      requestBody: {
        trashed: true
      }
    });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return json({ error: 'Failed to delete receipt' }, { status: 500 });
  }
};