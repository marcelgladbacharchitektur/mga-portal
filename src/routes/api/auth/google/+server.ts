import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

export const GET: RequestHandler = async ({ url }) => {
  const action = url.searchParams.get('action');
  
  if (action === 'login') {
    // Determine redirect URI dynamically
    let redirectUri = GOOGLE_REDIRECT_URI;
    
    // If we have a PUBLIC_APP_URL, use it
    if (PUBLIC_APP_URL) {
      redirectUri = `${PUBLIC_APP_URL}/auth/callback`;
    } else {
      // Otherwise, construct from current request
      const protocol = url.protocol;
      const host = url.host;
      redirectUri = `${protocol}//${host}/auth/callback`;
    }
    
    console.log('Google OAuth Config:', {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri: redirectUri,
      currentUrl: url.toString()
    });
    
    if (!GOOGLE_CLIENT_ID) {
      return new Response('Google OAuth not configured. Please check your environment variables.', { 
        status: 500 
      });
    }
    
    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    throw redirect(302, authUrl.toString());
  }
  
  return new Response('Invalid action', { status: 400 });
};