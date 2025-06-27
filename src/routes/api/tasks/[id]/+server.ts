import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

export const PATCH: RequestHandler = async ({ params, url, request, cookies }) => {
  try {
    const listId = url.searchParams.get('listId') || '@default';
    const taskId = params.id;
    const data = await request.json();
    
    // Get Google auth tokens
    const accessToken = cookies.get('google_access_token');
    const refreshToken = cookies.get('google_refresh_token');
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Tasks
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const tasks = google.tasks({ version: 'v1', auth });
    
    // Update task
    const response = await tasks.tasks.patch({
      tasklist: listId,
      task: taskId,
      requestBody: data
    });
    
    return json(response.data);
  } catch (error) {
    console.error('Error updating task:', error);
    return json({ error: 'Failed to update task' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, url, cookies }) => {
  try {
    const listId = url.searchParams.get('listId') || '@default';
    const taskId = params.id;
    
    // Get Google auth tokens
    const accessToken = cookies.get('google_access_token');
    const refreshToken = cookies.get('google_refresh_token');
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Tasks
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const tasks = google.tasks({ version: 'v1', auth });
    
    // Delete task
    await tasks.tasks.delete({
      tasklist: listId,
      task: taskId
    });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return json({ error: 'Failed to delete task' }, { status: 500 });
  }
};