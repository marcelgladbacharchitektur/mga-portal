import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    // Get Google auth tokens
    const accessToken = cookies.get('google_access_token');
    const refreshToken = cookies.get('google_refresh_token');
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Tasks
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const tasks = google.tasks({ version: 'v1', auth });
    
    // List task lists
    const response = await tasks.tasklists.list({
      maxResults: 100
    });
    
    return json(response.data.items || []);
  } catch (error) {
    console.error('Error fetching task lists:', error);
    return json({ error: 'Failed to fetch task lists' }, { status: 500 });
  }
};