import { createClient } from '@supabase/supabase-js';

// These will be populated once the user provides credentials
// RECOMMENDED: Store these in a .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * AUTH HELPERS
 */
export const getUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('User')
    .select('role, expertise_tags')
    .eq('id', userId)
    .single();
    
  if (error) return null;
  return data;
};
