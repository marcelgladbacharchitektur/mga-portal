import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBailomProject() {
  console.log('Lösche existierendes Testprojekt 25-001...');
  
  // Delete existing 25-001
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('project_id', '25-001');
  
  if (deleteError) {
    console.error('Fehler beim Löschen:', deleteError);
    return;
  }
  
  console.log('✅ Testprojekt gelöscht');
  
  // Import the correct Bailom project
  const bailomProject = {
    project_id: '25-001',
    name: 'EFH Bailom Vils',
    status: 'ACTIVE',
    cadastral_community: 'Vils',
  };
  
  console.log('Importiere EFH Bailom Vils...');
  
  const { data, error } = await supabase
    .from('projects')
    .insert(bailomProject)
    .select()
    .single();
  
  if (error) {
    console.error('Fehler beim Import:', error);
  } else {
    console.log('✅ Projekt importiert:', data);
  }
}

// Run the fix
fixBailomProject().catch(console.error);