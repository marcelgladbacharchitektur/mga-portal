import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeGoogleAuth } from '$lib/server/google-oauth';
import { google } from 'googleapis';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching receipt:', error);
      return json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return json({ error: 'Receipt not found' }, { status: 404 });
    }

    return json(data);
  } catch (error) {
    console.error('Error:', error);
    return json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const supabase = getSupabaseClient();
    const updates = await request.json();
    
    // Remove any undefined or null values
    const cleanedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    // Add updated_at timestamp
    cleanedUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('receipts')
      .update(cleanedUpdates)
      .eq('id', params.id);

    if (error) {
      console.error('Error updating receipt:', error);
      return json({ error: error.message }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return json({ error: 'Failed to update receipt' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  try {
    const receiptId = params.id;
    const supabase = getSupabaseClient();
    
    // First get the receipt from database to get the drive file ID
    const { data: receipt, error: fetchError } = await supabase
      .from('receipts')
      .select('drive_file_id')
      .eq('id', receiptId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching receipt:', fetchError);
      return json({ error: 'Receipt not found' }, { status: 404 });
    }
    
    // Delete from database first
    const { error: deleteError } = await supabase
      .from('receipts')
      .delete()
      .eq('id', receiptId);
    
    if (deleteError) {
      console.error('Error deleting from database:', deleteError);
      return json({ error: 'Failed to delete receipt from database' }, { status: 500 });
    }
    
    // If there's a drive file, try to delete it too (but don't fail if it doesn't work)
    if (receipt?.drive_file_id) {
      try {
        // Get Google auth tokens
        const accessToken = cookies.get('google_access_token') || process.env.GOOGLE_ACCESS_TOKEN;
        const refreshToken = cookies.get('google_refresh_token') || process.env.GOOGLE_REFRESH_TOKEN;
        
        if (accessToken) {
          // Initialize Google Drive
          const auth = initializeGoogleAuth(accessToken, refreshToken);
          const drive = google.drive({ version: 'v3', auth });
          
          // Move file to trash
          await drive.files.update({
            fileId: receipt.drive_file_id,
            requestBody: {
              trashed: true
            }
          });
        }
      } catch (driveError) {
        console.error('Error deleting from Drive (non-fatal):', driveError);
        // Don't fail the whole operation if Drive delete fails
      }
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return json({ error: 'Failed to delete receipt' }, { status: 500 });
  }
};