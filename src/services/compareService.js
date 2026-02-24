import { supabase } from '../lib/supabase';

/**
 * Get all saved comparisons for a user
 */
export async function getSavedCompares(userId) {
  const { data, error } = await supabase
    .from('saved_compares')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Save a comparison
 * @param {string} userId
 * @param {string} name - e.g. "MrBeast vs Ninja"
 * @param {string} creatorsParam - e.g. "youtube:mrbeast,twitch:ninja"
 */
export async function saveCompare(userId, name, creatorsParam) {
  const { data, error } = await supabase
    .from('saved_compares')
    .insert({ user_id: userId, name: name.trim(), creators_param: creatorsParam })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a saved comparison
 */
export async function deleteSavedCompare(id) {
  const { error } = await supabase
    .from('saved_compares')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
