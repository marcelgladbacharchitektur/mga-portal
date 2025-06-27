import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!project) return json({ error: 'Project not found' }, { status: 404 });
    
    return json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return json({ error: 'Failed to fetch project' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const data = await request.json();
    const supabase = getSupabaseClient();
    
    // Update the project
    const updateData: any = {
      name: data.name,
      status: data.status,
      cadastral_community: data.cadastral_community || null,
      plot_area: data.plot_area ? parseFloat(data.plot_area) : null,
      budget_hours: data.budget_hours ? parseInt(data.budget_hours) : null,
      updated_at: new Date().toISOString()
    };
    
    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return json({ error: 'Failed to update project' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return json({ error: 'Failed to delete project' }, { status: 500 });
  }
};