import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { google } from 'googleapis';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from '$env/static/private';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  if (error) {
    console.error('Google auth error:', error);
    throw redirect(303, '/projekte?auth_error=' + error);
  }
  
  if (!code) {
    throw redirect(303, '/projekte?auth_error=no_code');
  }
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens in cookies
    if (tokens.access_token) {
      cookies.set('google_access_token', tokens.access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }
    
    if (tokens.refresh_token) {
      cookies.set('google_refresh_token', tokens.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 year
      });
    }
    
    // Redirect back to projects page
    throw redirect(303, '/projekte?auth_success=true');
  } catch (error) {
    console.error('Token exchange error:', error);
    throw redirect(303, '/projekte?auth_error=token_exchange_failed');
  }
};