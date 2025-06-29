import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { fileId, targetFolderId, currentFolderId } = await request.json();
    
    if (!fileId || !targetFolderId) {
      return json({ error: 'File ID and target folder ID required' }, { status: 400 });
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
    
    // Get current file metadata
    const fileResponse = await drive.files.get({
      fileId: fileId,
      fields: 'parents'
    });
    
    const previousParents = fileResponse.data.parents ? fileResponse.data.parents.join(',') : '';
    
    // Move file to new folder
    const moveResponse = await drive.files.update({
      fileId: fileId,
      addParents: targetFolderId,
      removeParents: currentFolderId || previousParents,
      fields: 'id, name, parents'
    });
    
    return json({
      success: true,
      file: moveResponse.data
    });
  } catch (error: any) {
    console.error('Error moving file:', error);
    return json({ 
      error: 'Failed to move file',
      details: error.message 
    }, { status: 500 });
  }
};