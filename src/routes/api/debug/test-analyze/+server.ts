import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';
import { analyzeReceipt } from '$lib/server/gemini';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { fileId } = await request.json();
    
    // Get auth tokens
    const accessToken = cookies.get('google_access_token') || process.env.GOOGLE_ACCESS_TOKEN;
    const refreshToken = cookies.get('google_refresh_token') || process.env.GOOGLE_REFRESH_TOKEN;
    
    if (!accessToken) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    console.log('Test 1: Getting file metadata...');
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime'
    });
    console.log('File metadata:', fileMetadata.data);
    
    console.log('Test 2: Downloading file...');
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    console.log('File downloaded, size:', (response.data as ArrayBuffer).byteLength);
    
    console.log('Test 3: Analyzing with Gemini...');
    const analysis = await analyzeReceipt(
      response.data as ArrayBuffer,
      fileMetadata.data.mimeType || 'image/jpeg'
    );
    console.log('Analysis result:', analysis);
    
    return json({
      success: true,
      fileMetadata: fileMetadata.data,
      fileSize: (response.data as ArrayBuffer).byteLength,
      analysis: analysis
    });
  } catch (error: any) {
    console.error('Test analyze error:', error);
    return json({
      error: error.message,
      stack: error.stack,
      step: error.step || 'unknown'
    }, { status: 500 });
  }
};