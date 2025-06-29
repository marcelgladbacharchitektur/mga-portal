import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const testUrl = url.searchParams.get('url');
    const folderId = url.searchParams.get('folderId');
    
    // Get Google auth tokens
    const accessToken = cookies.get('google_access_token');
    const refreshToken = cookies.get('google_refresh_token');
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };
    
    // Test 1: Get user info
    try {
      const aboutResponse = await drive.about.get({
        fields: 'user(displayName, emailAddress)'
      });
      results.user = aboutResponse.data.user;
      results.tests.push({ test: 'Get user info', status: 'success' });
    } catch (error: any) {
      results.tests.push({ 
        test: 'Get user info', 
        status: 'failed',
        error: error.message 
      });
    }
    
    // Test 2: Extract folder ID from URL
    if (testUrl) {
      const urlFormats = [
        /folders\/([a-zA-Z0-9-_]+)/,
        /id=([a-zA-Z0-9-_]+)/,
        /\/d\/([a-zA-Z0-9-_]+)/
      ];
      
      let extractedId = null;
      for (const regex of urlFormats) {
        const match = testUrl.match(regex);
        if (match) {
          extractedId = match[1];
          break;
        }
      }
      
      results.urlAnalysis = {
        originalUrl: testUrl,
        extractedId: extractedId || testUrl.split('/').pop()?.split('?')[0]
      };
    }
    
    // Test 3: Try to access specific folder
    const folderToTest = folderId || results.urlAnalysis?.extractedId;
    if (folderToTest) {
      try {
        // Method 1: Get folder metadata
        const folderInfo = await drive.files.get({
          fileId: folderToTest,
          fields: 'id, name, mimeType, owners, permissions, capabilities',
          supportsAllDrives: true
        });
        
        results.folderAccess = {
          success: true,
          folder: {
            id: folderInfo.data.id,
            name: folderInfo.data.name,
            mimeType: folderInfo.data.mimeType,
            owners: folderInfo.data.owners,
            permissions: folderInfo.data.permissions,
            capabilities: folderInfo.data.capabilities
          }
        };
        results.tests.push({ test: 'Access folder metadata', status: 'success' });
      } catch (error: any) {
        results.folderAccess = {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            errors: error.errors
          }
        };
        results.tests.push({ 
          test: 'Access folder metadata', 
          status: 'failed',
          error: `${error.code}: ${error.message}`
        });
      }
      
      // Test 4: Try to list files in folder
      try {
        const filesResponse = await drive.files.list({
          q: `'${folderToTest}' in parents and trashed = false`,
          fields: 'files(id, name)',
          pageSize: 5,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true
        });
        
        results.listFiles = {
          success: true,
          fileCount: filesResponse.data.files?.length || 0,
          files: filesResponse.data.files
        };
        results.tests.push({ test: 'List files in folder', status: 'success' });
      } catch (error: any) {
        results.listFiles = {
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        };
        results.tests.push({ 
          test: 'List files in folder', 
          status: 'failed',
          error: `${error.code}: ${error.message}`
        });
      }
    }
    
    // Test 5: List root level folders
    try {
      const rootFolders = await drive.files.list({
        q: "'root' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: 'files(id, name)',
        pageSize: 10
      });
      
      results.rootFolders = {
        success: true,
        folders: rootFolders.data.files
      };
      results.tests.push({ test: 'List root folders', status: 'success' });
    } catch (error: any) {
      results.tests.push({ 
        test: 'List root folders', 
        status: 'failed',
        error: `${error.code}: ${error.message}`
      });
    }
    
    return json(results);
  } catch (error: any) {
    console.error('Drive test error:', error);
    return json({ 
      error: 'Test failed',
      details: error.message 
    }, { status: 500 });
  }
};