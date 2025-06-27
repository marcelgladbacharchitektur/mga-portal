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
    const accessToken = cookies.get('google_access_token');
    const refreshToken = cookies.get('google_refresh_token');
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    // List files in receipts folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and (mimeType contains 'image/' or mimeType='application/pdf')`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink)',
      orderBy: 'createdTime desc',
      pageSize: 100
    });
    
    return json({ files: response.data.files || [] });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
};