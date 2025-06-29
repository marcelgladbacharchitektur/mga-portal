import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

async function renameDriveFolder(project: any, updateData: any) {
  // Generate new folder name based on project data
  const newProjectId = updateData.project_id || project.project_id;
  const newName = updateData.name || project.name;
  const newFolderName = `${newProjectId} - ${newName}`;
  
  console.log('Renaming Drive folder to:', newFolderName);
  
  // Try to get auth tokens from environment variables
  // In a production setup, you might want to store these per user
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  if (!accessToken) {
    console.log('No Google access token available for folder rename');
    return;
  }
  
  try {
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    await drive.files.update({
      fileId: project.drive_folder_id,
      requestBody: {
        name: newFolderName
      }
    });
    
    console.log('Drive folder renamed successfully');
  } catch (error) {
    console.error('Failed to rename Drive folder:', error);
    throw error;
  }
}

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!project) return json({ error: 'Project not found' }, { status: 404 });
    
    return json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return json({ error: 'Failed to fetch project' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const data = await request.json();
    const supabase = getSupabaseClient();
    
    // Update the project
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only update fields that are provided
    if (data.name !== undefined) updateData.name = data.name;
    if (data.project_id !== undefined) updateData.project_id = data.project_id;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.cadastral_community !== undefined) updateData.cadastral_community = data.cadastral_community || null;
    if (data.plot_area !== undefined) updateData.plot_area = data.plot_area ? parseFloat(data.plot_area) : null;
    if (data.budget_hours !== undefined) updateData.budget_hours = data.budget_hours ? parseInt(data.budget_hours) : null;
    if (data.drive_folder_id !== undefined) updateData.drive_folder_id = data.drive_folder_id || null;
    if (data.calendar_id !== undefined) updateData.calendar_id = data.calendar_id || null;
    if (data.tasks_list_id !== undefined) updateData.tasks_list_id = data.tasks_list_id || null;
    if (data.description !== undefined) updateData.description = data.description || null;
    
    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Handle Drive folder renaming if requested
    if (data.renameDriveFolder && project.drive_folder_id && (data.name || data.project_id)) {
      try {
        await renameDriveFolder(project, data);
      } catch (driveError) {
        console.error('Drive folder rename failed:', driveError);
        // Don't fail the whole request if drive rename fails
      }
    }
    
    return json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return json({ error: 'Failed to update project' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return json({ error: 'Failed to delete project' }, { status: 500 });
  }
};