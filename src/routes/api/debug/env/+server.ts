import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
  // Only return safe debug info about environment variables
  return json({
    hasGeminiKey: !!env.GEMINI_API_KEY,
    geminiKeyLength: env.GEMINI_API_KEY?.length || 0,
    hasGoogleClientId: !!env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!env.GOOGLE_CLIENT_SECRET,
    hasGoogleTokens: {
      access: !!env.GOOGLE_ACCESS_TOKEN,
      refresh: !!env.GOOGLE_REFRESH_TOKEN
    },
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.PUBLIC_APP_URL || 'not set'
  });
};