import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Map of project IDs to their existing Google Drive folder URLs
const driveUrls = {
  '25-001': 'https://drive.google.com/drive/folders/1ywBzh-uYCf0biwG8Tn_xtvHzgB2qma5H',
  // Add more URLs here as you have them
  // '25-002': 'https://drive.google.com/drive/folders/...',
  // '25-003': 'https://drive.google.com/drive/folders/...',
  // etc.
};

async function updateDriveUrls() {
  console.log('Updating Google Drive URLs for projects...');
  
  for (const [projectId, driveUrl] of Object.entries(driveUrls)) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ drive_folder_url: driveUrl })
        .eq('project_id', projectId)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating ${projectId}:`, error);
      } else {
        console.log(`✅ Updated ${projectId}: ${data.name} with Drive URL`);
      }
    } catch (err) {
      console.error(`Failed to update ${projectId}:`, err);
    }
  }
  
  console.log('Update complete!');
}

// Run the update
updateDriveUrls().catch(console.error);