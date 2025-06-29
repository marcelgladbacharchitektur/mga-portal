import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
  const cookieAccessToken = cookies.get('google_access_token');
  const cookieRefreshToken = cookies.get('google_refresh_token');
  const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  const hasValidAuth = !!(cookieAccessToken || envAccessToken) && !!(cookieRefreshToken || envRefreshToken);
  
  return json({
    authenticated: hasValidAuth,
    tokens: {
      cookie: {
        hasAccessToken: !!cookieAccessToken,
        hasRefreshToken: !!cookieRefreshToken
      },
      environment: {
        hasAccessToken: !!envAccessToken,
        hasRefreshToken: !!envRefreshToken
      }
    },
    debug: {
      cookieAccessLength: cookieAccessToken?.length || 0,
      envAccessLength: envAccessToken?.length || 0
    }
  });
};