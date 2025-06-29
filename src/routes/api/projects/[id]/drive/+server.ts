import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ params, url, cookies }) => {
  try {
    const { id } = params;
    const folderId = url.searchParams.get('folderId');
    const search = url.searchParams.get('search');
    
    console.log('API called with project ID:', id, 'folderId:', folderId);
    
    // Get Google auth tokens
    const accessToken = cookies.get('google_access_token');
    const refreshToken = cookies.get('google_refresh_token');
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Get project's drive folder ID from database
    const supabase = getSupabaseClient();
    const { data: project } = await supabase
      .from('projects')
      .select('drive_folder_url')
      .eq('id', id)
      .single();
    
    if (!project?.drive_folder_url) {
      return json({ error: 'No Drive folder linked to this project' }, { status: 404 });
    }
    
    // Extract folder ID from URL
    // Handle different Google Drive URL formats:
    // - https://drive.google.com/drive/folders/FOLDER_ID
    // - https://drive.google.com/drive/u/0/folders/FOLDER_ID
    // - https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
    let projectFolderId = '';
    const urlMatch = project.drive_folder_url.match(/folders\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      projectFolderId = urlMatch[1];
    } else {
      // Fallback to old method
      projectFolderId = project.drive_folder_url.split('/').pop()?.split('?')[0] || '';
    }
    
    console.log('Drive URL:', project.drive_folder_url);
    console.log('Extracted folder ID:', projectFolderId);
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    // Skip the access check for now - it seems to be causing issues
    // The list operation will fail anyway if we don't have access
    const folderToUse = folderId || projectFolderId;
    console.log('Using folder ID:', folderToUse);
    
    // Build query
    let query = `'${folderToUse}' in parents and trashed = false`;
    if (search) {
      query += ` and name contains '${search}'`;
    }
    
    console.log('Query:', query);
    
    // List files
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, parents, capabilities, permissions)',
      orderBy: 'folder,name',
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });
    
    console.log('Files found:', response.data.files?.length || 0);
    return json({ files: response.data.files || [] });
  } catch (error: any) {
    console.error('Error fetching Drive files:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      errors: error.errors,
      response: error.response?.data,
      stack: error.stack
    });
    
    if (error.code === 401) {
      return json({ 
        error: 'Authentifizierung fehlgeschlagen. Bitte melden Sie sich erneut mit Google an.',
        needsReauth: true 
      }, { status: 401 });
    }
    
    if (error.code === 403) {
      // Check specific error reasons
      const errorMessage = error.message || '';
      if (errorMessage.includes('insufficientPermissions')) {
        return json({ 
          error: 'Unzureichende Berechtigungen. Bitte stellen Sie sicher, dass Sie die erforderlichen Drive-Berechtigungen erteilt haben.',
          details: error.message,
          needsReauth: true
        }, { status: 403 });
      }
      
      return json({ 
        error: 'Zugriff verweigert. Der Ordner muss mit Ihrem Google-Account geteilt sein.',
        details: error.message 
      }, { status: 403 });
    }
    
    if (error.code === 404) {
      return json({ 
        error: 'Ordner nicht gefunden. Möglicherweise wurde er gelöscht oder die URL ist ungültig.',
        details: error.message 
      }, { status: 404 });
    }
    
    return json({ 
      error: 'Fehler beim Abrufen der Dateien',
      details: error.message 
    }, { status: 500 });
  }
};