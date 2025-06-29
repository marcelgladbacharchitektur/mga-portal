import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
  try {
    if (!env.GEMINI_API_KEY) {
      return json({ 
        error: 'GEMINI_API_KEY not configured',
        hasKey: false 
      }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Simple text test
    const result = await model.generateContent('Say "Hello, API is working!" in JSON format with a key called "message"');
    const response = await result.response;
    const text = response.text();
    
    return json({
      success: true,
      geminiResponse: text,
      hasKey: true,
      keyLength: env.GEMINI_API_KEY.length
    });
  } catch (error: any) {
    console.error('Gemini test error:', error);
    return json({ 
      error: error.message,
      details: error.response?.data || error.stack,
      hasKey: !!env.GEMINI_API_KEY
    }, { status: 500 });
  }
};