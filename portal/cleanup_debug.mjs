import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uzzextbwpudmjpsyyziq.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6emV4dGJ3cHVkbWpwc3l5emlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyMTUyOCwiZXhwIjoyMDkxMzk3NTI4fQ.O53QhUGakVNTL_k4lGYc7d_ip09CTgKomXNeOibwzYY';

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function cleanup() {
  const userId = '8ed236c7-b7b1-4188-8262-221f1f9cae48';
  console.log(`Cleaning up test user: ${userId}`);
  
  // Delete from public.User (cascade should handle it if set, but we'll be explicit)
  await admin.from('User').delete().eq('id', userId);
  
  // Delete from Auth
  const { error } = await admin.auth.admin.deleteUser(userId);
  
  if (error) console.error('Cleanup error:', error.message);
  else console.log('✅ Cleanup successful.');
}

cleanup().catch(console.error);
