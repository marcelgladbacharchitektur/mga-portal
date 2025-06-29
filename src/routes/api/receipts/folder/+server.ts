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
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    // List folders
    const foldersResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, createdTime, modifiedTime)',
      orderBy: 'name',
      pageSize: 100
    });
    
    // List files
    const filesResponse = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and (mimeType contains 'image/' or mimeType='application/pdf')`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink)',
      orderBy: 'createdTime desc',
      pageSize: 100
    });
    
    return json({
      folders: foldersResponse.data.files || [],
      files: filesResponse.data.files || []
    });
  } catch (error: any) {
    console.error('Error fetching folder contents:', error);
    return json({ 
      error: 'Failed to fetch folder contents',
      details: error.message 
    }, { status: 500 });
  }
};