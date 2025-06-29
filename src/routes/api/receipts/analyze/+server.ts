import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';
import { analyzeReceipt } from '$lib/server/gemini';
import { getSupabaseClient } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { fileId, projectId } = await request.json();
    
    if (!fileId) {
      return json({ error: 'File ID required' }, { status: 400 });
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
    
    // Get file metadata including web links
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, webContentLink'
    });
    
    // Download file content
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    
    // Analyze with Gemini
    const analysis = await analyzeReceipt(
      response.data as ArrayBuffer,
      fileMetadata.data.mimeType || 'image/jpeg'
    );
    
    // Save to database
    const supabase = getSupabaseClient();
    const { data: receipt, error } = await supabase
      .from('receipts')
      .insert([{
        project_id: projectId || null,
        vendor: analysis.vendor,
        invoice_number: analysis.invoiceNumber,
        invoice_date: analysis.invoiceDate,
        amount: analysis.totalAmount || analysis.amount,
        currency: analysis.currency || 'EUR',
        tax_amount: analysis.taxAmount,
        payment_method: analysis.paymentMethod,
        category: analysis.category,
        drive_file_id: fileId,
        drive_file_url: fileMetadata.data.webViewLink || null,
        filename: fileMetadata.data.name,
        analysis_confidence: analysis.confidence,
        items: analysis.items ? JSON.stringify(analysis.items) : null,
        is_paid: analysis.isPaid || false
      }])
      .select()
      .single();
    
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
    console.error('Receipt analysis error:', error);
    return json({ 
      error: 'Failed to analyze receipt',
      details: error.message 
    }, { status: 500 });
  }
};