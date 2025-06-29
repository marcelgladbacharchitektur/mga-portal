import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';
import { getSettings } from '$lib/server/settings';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { fileId, invoiceDate, vendor, amount, invoiceNumber } = await request.json();
    
    console.log('Receipt organize request:', { fileId, invoiceDate, vendor, amount, invoiceNumber });
    
    if (!fileId) {
      return json({ error: 'File ID required' }, { status: 400 });
    }
    
    // Use current date if invoice date is not provided
    const finalInvoiceDate = invoiceDate || new Date().toISOString().split('T')[0];
    console.log('Using invoice date:', finalInvoiceDate);
    
    // Get settings for the correct archive folder
    const settings = await getSettings();
    const ARCHIVE_FOLDER_ID = settings.drive_folders.receipts_archive;
    
    console.log('Using archive folder ID:', ARCHIVE_FOLDER_ID);
    
    if (!ARCHIVE_FOLDER_ID) {
      return json({ error: 'Archive folder not configured in settings' }, { status: 400 });
    }
    
    // Get Google auth tokens
    const accessToken = cookies.get('google_access_token') || process.env.GOOGLE_ACCESS_TOKEN;
    const refreshToken = cookies.get('google_refresh_token') || process.env.GOOGLE_REFRESH_TOKEN;
    
    console.log('Auth tokens available:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken,
      fromCookies: !!cookies.get('google_access_token')
    });
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    // Parse the invoice date
    const date = new Date(finalInvoiceDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthName = date.toLocaleDateString('de-AT', { month: 'long' });
    
    // Check if year folder exists
    let yearFolderId = '';
    const yearFolderName = year.toString();
    
    console.log('Searching for year folder:', yearFolderName, 'in parent:', ARCHIVE_FOLDER_ID);
    
    const yearSearchResponse = await drive.files.list({
      q: `name='${yearFolderName}' and '${ARCHIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    
    console.log('Year folder search result:', yearSearchResponse.data.files);
    
    if (yearSearchResponse.data.files && yearSearchResponse.data.files.length > 0) {
      yearFolderId = yearSearchResponse.data.files[0].id!;
      console.log('Found existing year folder:', yearFolderId);
    } else {
      // Create year folder
      console.log('Creating new year folder:', yearFolderName);
      const yearFolderResponse = await drive.files.create({
        requestBody: {
          name: yearFolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [ARCHIVE_FOLDER_ID]
        },
        fields: 'id'
      });
      yearFolderId = yearFolderResponse.data.id!;
      console.log('Created year folder with ID:', yearFolderId);
    }
    
    // Check if month folder exists
    let monthFolderId = '';
    const monthFolderName = `${month} - ${monthName}`;
    
    const monthSearchResponse = await drive.files.list({
      q: `name='${monthFolderName}' and '${yearFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    
    if (monthSearchResponse.data.files && monthSearchResponse.data.files.length > 0) {
      monthFolderId = monthSearchResponse.data.files[0].id!;
    } else {
      // Create month folder
      const monthFolderResponse = await drive.files.create({
        requestBody: {
          name: monthFolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [yearFolderId]
        },
        fields: 'id'
      });
      monthFolderId = monthFolderResponse.data.id!;
    }
    
    // Get current file metadata
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'name, parents, mimeType'
    });
    
    // Generate new filename
    const fileExtension = fileMetadata.data.name?.split('.').pop() || 'pdf';
    const dateStr = new Date(finalInvoiceDate).toISOString().split('T')[0];
    const cleanVendor = vendor ? vendor.replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, '').substring(0, 30) : 'Unbekannt';
    const amountStr = amount ? amount.toFixed(2).replace('.', ',') : '0,00';
    const invoiceStr = invoiceNumber ? `_${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}` : '';
    
    // Format: YYYY-MM-DD_Vendor_Amount_InvoiceNumber.extension
    const newFileName = `${dateStr}_${cleanVendor}_EUR${amountStr}${invoiceStr}.${fileExtension}`;
    
    // Move file to the month folder and rename
    const previousParents = fileMetadata.data.parents?.join(',') || '';
    
    console.log('Generated filename details:', {
      originalInvoiceDate: invoiceDate,
      finalInvoiceDate,
      dateStr,
      cleanVendor,
      amountStr,
      invoiceStr,
      newFileName
    });
    
    console.log('Moving file:', {
      fileId,
      newFileName,
      monthFolderId,
      previousParents
    });
    
    const updateResult = await drive.files.update({
      fileId: fileId,
      requestBody: {
        name: newFileName
      },
      addParents: monthFolderId,
      removeParents: previousParents,
      fields: 'id, name, parents'
    });
    
    console.log('File successfully organized:', updateResult.data);
    
    return json({ 
      success: true,
      message: `File moved to ${yearFolderName}/${monthFolderName}`,
      yearFolder: yearFolderName,
      monthFolder: monthFolderName,
      newFileName
    });
  } catch (error: any) {
    console.error('Error organizing receipt:', error);
    return json({ 
      error: 'Failed to organize receipt',
      details: error.message 
    }, { status: 500 });
  }
};