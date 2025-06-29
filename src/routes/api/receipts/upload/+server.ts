import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';
import { Readable } from 'stream';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;
    
    if (!file || !folderId) {
      return json({ error: 'File and folder ID required' }, { status: 400 });
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
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create readable stream from buffer
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${timestamp}_${file.name}`;
    
    // Upload file
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId]
      },
      media: {
        mimeType: file.type,
        body: stream
      },
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink'
    });
    
    return json(response.data);
  } catch (error: any) {
    console.error('Error uploading receipt:', error);
    return json({ 
      error: 'Failed to upload receipt',
      details: error.message || 'Unknown error',
      code: error.code
    }, { status: 500 });
  }
};