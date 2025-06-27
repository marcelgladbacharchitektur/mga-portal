import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { google } from 'googleapis';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/callback'
    );
    
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/tasks',
    ];
    
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force to get refresh token
    });
    
    return json({ url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
};