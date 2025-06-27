import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Existing projects to import
const existingProjects = [
  {
    project_id: '25-001',
    name: 'EFH Bailom Vils',
    status: 'ACTIVE',
    cadastral_community: 'Vils',
  },
  {
    project_id: '25-002',
    name: 'Spritzenhaus Kaisers Fügel',
    status: 'ACTIVE',
    cadastral_community: 'Kaisers',
  },
  {
    project_id: '25-003',
    name: 'Alpenblick Rinnen Hierzer',
    status: 'ACTIVE',
    cadastral_community: 'Rinnen',
  },
  {
    project_id: '25-004',
    name: 'Guem Christian Carport',
    status: 'ACTIVE',
  },
  {
    project_id: '25-005',
    name: 'Guem Josef - Umbau Ehrwald',
    status: 'ACTIVE',
    cadastral_community: 'Ehrwald',
  },
  {
    project_id: '25-006',
    name: 'Iost Korbinian - Carport Heiterwang',
    status: 'ACTIVE',
    cadastral_community: 'Heiterwang',
  },
];

async function importProjects() {
  console.log('Starting project import...');
  
  for (const project of existingProjects) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      
      if (error) {
        console.error(`Error importing ${project.project_id}:`, error);
      } else {
        console.log(`✅ Imported project: ${project.project_id} - ${project.name}`);
      }
    } catch (err) {
      console.error(`Failed to import ${project.project_id}:`, err);
    }
  }
  
  console.log('Import complete!');
}

// Run the import
importProjects().catch(console.error);