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
    const projectFolderId = project.drive_folder_url.split('/').pop();
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    // First, check if we have access to the folder
    try {
      const folderToCheck = folderId || projectFolderId;
      console.log('Checking access to folder:', folderToCheck);
      
      // Try to get folder metadata first
      const folderInfo = await drive.files.get({
        fileId: folderToCheck,
        fields: 'id, name, mimeType, permissions'
      });
      
      console.log('Folder info:', folderInfo.data);
    } catch (folderError: any) {
      console.error('Folder access check failed:', folderError);
      if (folderError.code === 404) {
        return json({ error: 'Ordner nicht gefunden' }, { status: 404 });
      } else if (folderError.code === 403) {
        return json({ 
          error: 'Sie haben keinen Zugriff auf diesen Ordner. Bitte stellen Sie sicher, dass der Ordner mit Ihrem Google-Account geteilt wurde.',
          details: folderError.message 
        }, { status: 403 });
      }
    }
    
    // Build query
    let query = `'${folderId || projectFolderId}' in parents and trashed = false`;
    if (search) {
      query += ` and name contains '${search}'`;
    }
    
    // List files
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, parents)',
      orderBy: 'folder,name',
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });
    
    return json({ files: response.data.files || [] });
  } catch (error: any) {
    console.error('Error fetching Drive files:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      errors: error.errors,
      response: error.response?.data
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