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
      pageSize: 100
    });
    
    return json({ files: response.data.files || [] });
  } catch (error) {
    console.error('Error fetching Drive files:', error);
    return json({ error: 'Failed to fetch files' }, { status: 500 });
  }
};