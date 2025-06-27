import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
  const accessToken = cookies.get('google_access_token');
  const refreshToken = cookies.get('google_refresh_token');
  
  return json({
    authenticated: !!(accessToken && refreshToken),
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken
  });
};