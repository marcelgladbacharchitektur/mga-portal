import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';

const ARCHIVE_FOLDER_ID = '100iNRjpLvKTywgWlDZxdrcTKynHN1tDP';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { fileId, invoiceDate, vendor, amount, invoiceNumber } = await request.json();
    
    if (!fileId || !invoiceDate) {
      return json({ error: 'File ID and invoice date required' }, { status: 400 });
    }
    
    // Get Google auth tokens
    const accessToken = cookies.get('google_access_token');
    const refreshToken = cookies.get('google_refresh_token');
    
    if (!accessToken) {
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    // Parse the invoice date
    const date = new Date(invoiceDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthName = date.toLocaleDateString('de-AT', { month: 'long' });
    
    // Check if year folder exists
    let yearFolderId = '';
    const yearFolderName = year.toString();
    
    const yearSearchResponse = await drive.files.list({
      q: `name='${yearFolderName}' and '${ARCHIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });
    
    if (yearSearchResponse.data.files && yearSearchResponse.data.files.length > 0) {
      yearFolderId = yearSearchResponse.data.files[0].id!;
    } else {
      // Create year folder
      const yearFolderResponse = await drive.files.create({
        requestBody: {
          name: yearFolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [ARCHIVE_FOLDER_ID]
        },
        fields: 'id'
      });
      yearFolderId = yearFolderResponse.data.id!;
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
    const dateStr = new Date(invoiceDate).toISOString().split('T')[0];
    const cleanVendor = vendor ? vendor.replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, '').substring(0, 30) : 'Unbekannt';
    const amountStr = amount ? amount.toFixed(2).replace('.', ',') : '0,00';
    const invoiceStr = invoiceNumber ? `_${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}` : '';
    
    // Format: YYYY-MM-DD_Vendor_Amount_InvoiceNumber.extension
    const newFileName = `${dateStr}_${cleanVendor}_EUR${amountStr}${invoiceStr}.${fileExtension}`;
    
    // Move file to the month folder and rename
    const previousParents = fileMetadata.data.parents?.join(',') || '';
    
    await drive.files.update({
      fileId: fileId,
      requestBody: {
        name: newFileName
      },
      addParents: monthFolderId,
      removeParents: previousParents,
      fields: 'id, name, parents'
    });
    
    return json({ 
      success: true,
      message: `File moved to ${yearFolderName}/${monthFolderName}`,
      yearFolder: yearFolderName,
      monthFolder: monthFolderName
    });
  } catch (error: any) {
    console.error('Error organizing receipt:', error);
    return json({ 
      error: 'Failed to organize receipt',
      details: error.message 
    }, { status: 500 });
  }
};