import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const listId = url.searchParams.get('listId') || '@default';
    
    // Get Google auth tokens
    const accessToken = cookies.get('google_access_token');
    const refreshToken = cookies.get('google_refresh_token');
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Tasks
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const tasks = google.tasks({ version: 'v1', auth });
    
    // List tasks
    const response = await tasks.tasks.list({
      tasklist: listId,
      maxResults: 100,
      showCompleted: true,
      showHidden: false
    });
    
    return json(response.data.items || []);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ url, request, cookies }) => {
  try {
    const listId = url.searchParams.get('listId') || '@default';
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
    
    // Create task
    const response = await tasks.tasks.insert({
      tasklist: listId,
      requestBody: {
        title: data.title,
        notes: data.notes,
        due: data.due ? new Date(data.due).toISOString() : undefined
      }
    });
    
    return json(response.data);
  } catch (error) {
    console.error('Error creating task:', error);
    return json({ error: 'Failed to create task' }, { status: 500 });
  }
};