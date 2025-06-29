import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';
import { analyzeReceipt } from '$lib/server/gemini';
import { getSupabaseClient } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { fileId, projectId, receiptId } = await request.json();
    console.log('Receipt analysis request:', { fileId, projectId, receiptId });
    
    if (!fileId) {
      return json({ error: 'File ID required' }, { status: 400 });
    }
    
    // Get Google auth tokens (same logic as upload endpoint)
    const accessToken = cookies.get('google_access_token') || process.env.GOOGLE_ACCESS_TOKEN;
    const refreshToken = cookies.get('google_refresh_token') || process.env.GOOGLE_REFRESH_TOKEN;
    
    console.log('Auth status:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      fromCookies: !!cookies.get('google_access_token')
    });
    
    if (!accessToken) {
      console.error('No access token found');
      return json({ error: 'Not authenticated with Google' }, { status: 401 });
    }
    
    // Initialize Google Drive
    const auth = initializeGoogleAuth(accessToken, refreshToken);
    const drive = google.drive({ version: 'v3', auth });
    
    // Get file metadata including web links
    console.log('Fetching file metadata...');
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, webContentLink'
    });
    console.log('File metadata:', fileMetadata.data);
    
    // Download file content
    console.log('Downloading file content...');
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    console.log('File downloaded, size:', (response.data as ArrayBuffer).byteLength);
    
    // Analyze with Gemini
    console.log('Starting Gemini analysis...');
    const analysis = await analyzeReceipt(
      response.data as ArrayBuffer,
      fileMetadata.data.mimeType || 'image/jpeg'
    );
    console.log('Analysis complete:', analysis);
    
    // Save to database
    const supabase = getSupabaseClient();
    
    // First, check which columns exist in the table
    const insertData: any = {
      project_id: projectId || null,
      vendor: analysis.vendor || 'Unknown',
      amount: analysis.totalAmount || analysis.amount || 0,
      currency: analysis.currency || 'EUR',
      drive_file_id: fileId,
      filename: fileMetadata.data.name
    };
    
    // Add optional fields if they exist
    if (analysis.invoiceNumber) insertData.invoice_number = analysis.invoiceNumber;
    if (analysis.invoiceDate) insertData.invoice_date = analysis.invoiceDate;
    if (analysis.taxAmount) insertData.tax_amount = analysis.taxAmount;
    if (analysis.paymentMethod) insertData.payment_method = analysis.paymentMethod;
    if (analysis.category) insertData.category = analysis.category;
    if (fileMetadata.data.webViewLink) insertData.file_url = fileMetadata.data.webViewLink;
    if (analysis.items) insertData.items = analysis.items;
    
    // Try to insert without analysis_confidence first
    console.log('Inserting receipt data:', insertData);
    
    let receipt;
    let error;
    
    if (receiptId) {
      // Update existing receipt
      console.log('Updating existing receipt:', receiptId);
      const updateResult = await supabase
        .from('receipts')
        .update({
          ...insertData,
          updated_at: new Date().toISOString()
        })
        .eq('id', receiptId)
        .select()
        .single();
      
      receipt = updateResult.data;
      error = updateResult.error;
    } else {
      // Insert new receipt
      const insertResult = await supabase
        .from('receipts')
        .insert([insertData])
        .select()
        .single();
      
      receipt = insertResult.data;
      error = insertResult.error;
    }
    
    if (error) throw error;
    
    // Organize the file into year/month folders
    if (receipt && analysis.invoiceDate) {
      try {
        const organizeResponse = await fetch(`${request.url.origin}/api/receipts/organize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            fileId: fileId,
            invoiceDate: analysis.invoiceDate,
            vendor: analysis.vendor,
            amount: analysis.totalAmount || analysis.amount,
            invoiceNumber: analysis.invoiceNumber
          })
        });
        
        if (!organizeResponse.ok) {
          console.error('Failed to organize receipt:', await organizeResponse.text());
        }
      } catch (orgError) {
        console.error('Error organizing receipt:', orgError);
        // Don't fail the whole request if organizing fails
      }
    }
    
    return json({ 
      receipt,
      analysis
    });
  } catch (error: any) {
    console.error('Receipt analysis error:', {
      message: error.message,
      stack: error.stack
    });
    
    // Provide more specific error messages
    if (error.message?.includes('Gemini API key')) {
      return json({ 
        error: 'AI service not configured',
        details: 'GEMINI_API_KEY environment variable is missing'
      }, { status: 503 });
    }
    
    if (error.message?.includes('Not authenticated')) {
      return json({ 
        error: 'Google authentication required',
        details: 'Please login with Google first'
      }, { status: 401 });
    }
    
    return json({ 
      error: 'Failed to analyze receipt',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
};