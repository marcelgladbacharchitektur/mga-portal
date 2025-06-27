import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

const RECEIPTS_FOLDER_NAME = 'MGA Portal - Belege';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    // Get Google auth tokens
    const accessToken = cookies.get('google_access_token');
    const refreshToken = cookies.get('google_refresh_token');
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    // Search for receipts folder
    const searchResponse = await drive.files.list({
      q: `name='${RECEIPTS_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    
    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      // Folder exists
      return json(searchResponse.data.files[0]);
    }
    
    // Create folder if it doesn't exist
    const createResponse = await drive.files.create({
      requestBody: {
        name: RECEIPTS_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id, name'
    });
    
    return json(createResponse.data);
  } catch (error) {
    console.error('Error managing receipts folder:', error);
    return json({ error: 'Failed to manage receipts folder' }, { status: 500 });
  }
};