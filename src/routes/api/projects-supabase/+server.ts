import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient, type Project } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return json(projects || []);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    const supabase = getSupabaseClient();
    
    // Generate project ID (YY-NNN format)
    const year = new Date().getFullYear().toString().slice(-2);
    
    // Get count of existing projects for this year
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .like('project_id', `${year}-%`);
    
    const projectNumber = (count || 0) + 1;
    const projectId = `${year}-${projectNumber.toString().padStart(3, '0')}`;
    
    // Create the project
    const projectData: Partial<Project> = {
      project_id: projectId,
      name: data.name,
      status: data.status || 'ACTIVE',
      client_id: data.client_id,
      cadastral_community: data.cadastral_community,
      plot_area: data.plot_area,
      budget_hours: data.budget_hours,
    };
    
    const { data: project, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();
    
    if (error) throw error;
    
    // Create Google Drive folder, Calendar, and Tasks list
    try {
      // Get Google auth tokens from cookies
      const accessToken = cookies.get('google_access_token');
      const refreshToken = cookies.get('google_refresh_token');
      
      if (!accessToken) {
        console.log('No Google access token, skipping Google integrations');
        return json(project);
      }
      
      const { initializeGoogleAuth } = await import('$lib/server/google-oauth');
      const auth = initializeGoogleAuth(accessToken, refreshToken);
      const { google } = await import('googleapis');
      
      const drive = google.drive({ version: 'v3', auth });
      const calendar = google.calendar({ version: 'v3', auth });
      const tasks = google.tasks({ version: 'v1', auth });
      
      // Create Drive folder
      const folderResponse = await drive.files.create({
        requestBody: {
          name: `${projectId} - ${data.name}`,
          mimeType: 'application/vnd.google-apps.folder',
        },
      });
      const driveUrl = `https://drive.google.com/drive/folders/${folderResponse.data.id}`;
      
      // Create Calendar
      const calendarResponse = await calendar.calendars.insert({
        requestBody: {
          summary: `${projectId} - ${data.name}`,
        },
      });
      
      // Create Tasks list
      const taskListResponse = await tasks.tasklists.insert({
        requestBody: {
          title: `${projectId} - ${data.name}`,
        },
      });
      
      // Update project with Google IDs
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          drive_folder_url: driveUrl,
          calendar_id: calendarResponse.data.id,
          tasks_list_id: taskListResponse.data.id,
        })
        .eq('id', project.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return json(updatedProject);
    } catch (googleError) {
      console.error('Google API error (non-fatal):', googleError);
      // Return project even if Google APIs fail
      return json(project);
    }
  } catch (error) {
    console.error('Error creating project:', error);
    return json({ error: 'Failed to create project' }, { status: 500 });
  }
};