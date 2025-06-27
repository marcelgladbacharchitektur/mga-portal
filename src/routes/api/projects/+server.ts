import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { google } from 'googleapis';
import { getGoogleAuth } from '$lib/server/google-auth';
import { GOOGLE_SPREADSHEET_ID } from '$env/static/private';

export const GET: RequestHandler = async () => {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SPREADSHEET_ID,
      range: 'Projekte!A:K',
    });

    const rows = response.data.values || [];
    
    // Skip header row and map to objects
    const projects = rows.slice(1).map(row => ({
      projektId: row[0] || '',
      projektname: row[1] || '',
      status: row[2] || '',
      kundenKontaktId: row[3] || '',
      katastralgemeinde: row[4] || '',
      grundstuecksflaeche: row[5] || '',
      budgetStunden: row[6] || '',
      driveOrdnerUrl: row[7] || '',
      photosAlbumUrl: row[8] || '',
      tasksListenId: row[9] || '',
      calendarId: row[10] || '',
    }));

    return json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const auth = getGoogleAuth();
    
    // Initialize all Google services
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });
    const tasks = google.tasks({ version: 'v1', auth });
    const calendar = google.calendar({ version: 'v3', auth });

    // Generate project ID (YY-NNN format)
    const year = new Date().getFullYear().toString().slice(-2);
    const existingProjects = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SPREADSHEET_ID,
      range: 'Projekte!A:A',
    });
    const count = (existingProjects.data.values?.length || 0);
    const projectId = `${year}-${count.toString().padStart(3, '0')}`;

    // Create Google Drive folder
    const folderResponse = await drive.files.create({
      requestBody: {
        name: `${projectId} - ${data.projektname}`,
        mimeType: 'application/vnd.google-apps.folder',
      },
    });
    const driveUrl = `https://drive.google.com/drive/folders/${folderResponse.data.id}`;

    // Create Tasks list
    const taskListResponse = await tasks.tasklists.insert({
      requestBody: {
        title: `${projectId} - ${data.projektname}`,
      },
    });

    // Create Calendar
    const calendarResponse = await calendar.calendars.insert({
      requestBody: {
        summary: `${projectId} - ${data.projektname}`,
      },
    });

    // Prepare row data
    const rowData = [
      projectId,
      data.projektname,
      data.status || 'ACTIVE',
      data.kundenKontaktId || '',
      data.katastralgemeinde || '',
      data.grundstuecksflaeche || '',
      data.budgetStunden || '',
      driveUrl,
      '', // Photos album URL - needs separate implementation
      taskListResponse.data.id || '',
      calendarResponse.data.id || '',
    ];

    // Add to spreadsheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SPREADSHEET_ID,
      range: 'Projekte!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return json({
      projektId,
      driveUrl,
      tasksListId: taskListResponse.data.id,
      calendarId: calendarResponse.data.id,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return json({ error: 'Failed to create project' }, { status: 500 });
  }
};