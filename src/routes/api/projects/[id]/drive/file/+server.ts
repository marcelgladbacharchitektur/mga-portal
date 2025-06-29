import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const fileId = url.searchParams.get('fileId');
    const action = url.searchParams.get('action'); // 'download' or 'export'
    
    if (!fileId) {
      return json({ error: 'File ID required' }, { status: 400 });
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
    
    // Get file metadata
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, webContentLink, exportLinks',
      supportsAllDrives: true
    });
    
    const fileData = file.data;
    
    // Generate appropriate link based on file type
    let accessLink = '';
    
    if (fileData.webContentLink) {
      // Regular files (PDFs, images, etc.) - direct download link
      accessLink = fileData.webContentLink;
    } else if (fileData.webViewLink) {
      // Google Docs/Sheets/Slides - view link
      accessLink = fileData.webViewLink;
    } else if (fileData.exportLinks) {
      // For Google Docs, we can export as PDF
      if (fileData.mimeType === 'application/vnd.google-apps.document') {
        accessLink = fileData.exportLinks['application/pdf'] || '';
      } else if (fileData.mimeType === 'application/vnd.google-apps.spreadsheet') {
        accessLink = fileData.exportLinks['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] || '';
      } else if (fileData.mimeType === 'application/vnd.google-apps.presentation') {
        accessLink = fileData.exportLinks['application/pdf'] || '';
      }
    }
    
    // If we want to download/export, fetch the content
    if (action === 'download' && accessLink) {
      try {
        const response = await fetch(accessLink, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to download file');
        }
        
        const buffer = await response.arrayBuffer();
        
        return new Response(buffer, {
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileData.name}"`
          }
        });
      } catch (error) {
        console.error('Download error:', error);
        return json({ error: 'Failed to download file' }, { status: 500 });
      }
    }
    
    return json({
      file: fileData,
      accessLink,
      exportLinks: fileData.exportLinks || {}
    });
  } catch (error: any) {
    console.error('Error accessing file:', error);
    return json({ error: 'Failed to access file' }, { status: 500 });
  }
};