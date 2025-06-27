import { google } from 'googleapis';
import { env } from '$env/dynamic/private';

export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );

  // If we have tokens, set them
  if (env.GOOGLE_ACCESS_TOKEN) {
    oauth2Client.setCredentials({
      access_token: env.GOOGLE_ACCESS_TOKEN,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
    });
  }

  return oauth2Client;
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/tasks',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
}