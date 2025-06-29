import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { getSettings } from '$lib/server/settings';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    console.log('Receipt upload request received');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    let folderId = formData.get('folderId') as string;
    
    // If no folder ID provided, use settings
    if (!folderId) {
      const settings = await getSettings();
      folderId = settings.drive_folders.receipts;
    }
    
    console.log('File:', file?.name, 'Size:', file?.size, 'Type:', file?.type);
    console.log('Folder ID:', folderId);
    
    if (!file || !folderId) {
      return json({ error: 'File and folder ID required' }, { status: 400 });
    }
    
    // Get Google auth tokens from cookies or environment (same logic as test-drive)
    let accessToken = cookies.get('google_access_token') || process.env.GOOGLE_ACCESS_TOKEN;
    let refreshToken = cookies.get('google_refresh_token') || process.env.GOOGLE_REFRESH_TOKEN;
    
    console.log('Auth tokens:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken,
      fromCookies: !!cookies.get('google_access_token'),
      fromEnv: !!process.env.GOOGLE_ACCESS_TOKEN,
      tokenLength: accessToken?.length || 0
    });
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google. Please login first.' }, { status: 401 });
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
    
    // First test if we can access Drive (like test-drive endpoint)
    console.log('Testing Drive access...');
    try {
      const testResponse = await drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)'
      });
      console.log('Drive access test successful:', testResponse.data.files?.length || 0, 'files found');
    } catch (testError: any) {
      console.error('Drive access test failed:', testError);
      return json({ 
        error: 'Drive authentication failed',
        details: testError.message,
        code: testError.code
      }, { status: 401 });
    }
    
    // Upload file
    console.log('Attempting file upload...');
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
    
    console.log('Upload successful:', response.data.id);
    return json(response.data);
  } catch (error: any) {
    console.error('Error uploading receipt:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    return json({ 
      error: 'Failed to upload receipt',
      details: error.message || 'Unknown error',
      code: error.code,
      responseData: error.response?.data
    }, { status: 500 });
  }
};