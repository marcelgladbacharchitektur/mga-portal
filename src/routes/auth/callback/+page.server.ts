import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { google } from 'googleapis';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ url, cookies }) => {
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
    // Determine redirect URI dynamically (same logic as in auth endpoint)
    let redirectUri = GOOGLE_REDIRECT_URI;
    if (PUBLIC_APP_URL) {
      redirectUri = `${PUBLIC_APP_URL}/auth/callback`;
    } else {
      const protocol = url.protocol;
      const host = url.host;
      redirectUri = `${protocol}//${host}/auth/callback`;
    }
    
    console.log('OAuth2 Client Config:', {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
      redirectUri: redirectUri
    });
    
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token
    });
    
    // Store tokens in cookies
    if (tokens.access_token) {
      cookies.set('google_access_token', tokens.access_token, {
        path: '/',
        httpOnly: true,
        secure: false, // Set to true in production
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }
    
    if (tokens.refresh_token) {
      cookies.set('google_refresh_token', tokens.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: false, // Set to true in production
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 year
      });
    }
    
    // Redirect back to projects page
    throw redirect(303, '/projekte?auth_success=true');
  } catch (error: any) {
    console.error('Token exchange error:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw redirect(303, '/projekte?auth_error=token_exchange_failed');
  }
};