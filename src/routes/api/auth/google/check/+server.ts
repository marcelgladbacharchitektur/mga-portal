import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ url }) => {
  // Determine redirect URI dynamically (same logic as auth endpoint)
  let redirectUri = GOOGLE_REDIRECT_URI;
  
  if (PUBLIC_APP_URL) {
    redirectUri = `${PUBLIC_APP_URL}/auth/callback`;
  } else {
    const protocol = url.protocol;
    const host = url.host;
    redirectUri = `${protocol}//${host}/auth/callback`;
  }
  
  return json({
    currentUrl: url.toString(),
    protocol: url.protocol,
    host: url.host,
    origin: url.origin,
    computedRedirectUri: redirectUri,
    envVars: {
      GOOGLE_REDIRECT_URI: GOOGLE_REDIRECT_URI || 'NOT SET',
      PUBLIC_APP_URL: PUBLIC_APP_URL || 'NOT SET',
      GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'
    }
  });
};