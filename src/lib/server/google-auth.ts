import { google } from 'googleapis';
import { GOOGLE_SERVICE_ACCOUNT_JSON } from '$env/static/private';

export function getGoogleAuth() {
  if (!GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set');
  }

  const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/photoslibrary',
      'https://www.googleapis.com/auth/tasks',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/contacts.readonly',
    ],
  });

  return auth;
}