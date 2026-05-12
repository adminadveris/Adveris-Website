import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uzzextbwpudmjpsyyziq.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6emV4dGJ3cHVkbWpwc3l5emlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyMTUyOCwiZXhwIjoyMDkxMzk3NTI4fQ.O53QhUGakVNTL_k4lGYc7d_ip09CTgKomXNeOibwzYY';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function debugUserCreation() {
  console.log('--- Starting Debug: User Creation ---');

  // 1. Try to create a dummy user
  const testEmail = `test_${Date.now()}@example.com`;
  const testPass = 'Test@123456';
  
  console.log(`Attempting to create user: ${testEmail}`);
  
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPass,
    email_confirm: true,
    user_metadata: { full_name: 'Test Debug User' }
  });

  if (authError) {
    console.error('❌ Auth User Creation Failed:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log('✅ Auth User Created. ID:', userId);

  // 2. Check if a row exists in 'User' table
  console.log(`Checking 'User' table for ID: ${userId}...`);
  const { data: userData, error: userError } = await admin
    .from('User')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) {
    console.error('❌ Sync Failed: No record in public.User table.', userError.message);
    console.log('This usually means the trigger is failing or missing.');
  } else {
    console.log('✅ Sync Succeeded: Found record in public.User table.');
    console.log('User Data:', userData);
  }

  // 3. Clean up (optional)
  // await admin.auth.admin.deleteUser(userId);
}

debugUserCreation().catch(console.error);
