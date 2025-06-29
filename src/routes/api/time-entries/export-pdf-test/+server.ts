import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Simple test to check if the endpoint works
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    
    return json({
      message: 'PDF export endpoint is working',
      params: { start, end },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return json({ error: 'Test endpoint failed' }, { status: 500 });
  }
};