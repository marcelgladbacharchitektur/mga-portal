import { google } from 'googleapis';
import { env } from '$env/dynamic/private';

// Für lokale Entwicklung: OAuth2 mit persönlichem Google Account
// Für Produktion: Service Account (wenn möglich) oder OAuth2

export function getGoogleAuth() {
  // Option 1: Service Account (wenn verfügbar)
  if (env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
      return new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/tasks',
        ],
      });
    } catch (error) {
      console.error('Service Account parsing failed:', error);
    }
  }
  
  // Option 2: OAuth2 (Fallback)
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/callback'
    );
    
    // If we have saved tokens, use them
    if (env.GOOGLE_ACCESS_TOKEN) {
      oauth2Client.setCredentials({
        access_token: env.GOOGLE_ACCESS_TOKEN,
        refresh_token: env.GOOGLE_REFRESH_TOKEN,
      });
    }
    
    return oauth2Client;
  }
  
  throw new Error('No Google authentication configured. Please set up either Service Account or OAuth2.');
}

// Helper to create Google services
export function getGoogleServices() {
  const auth = getGoogleAuth();
  
  return {
    drive: google.drive({ version: 'v3', auth }),
    calendar: google.calendar({ version: 'v3', auth }),
    tasks: google.tasks({ version: 'v1', auth }),
  };
}