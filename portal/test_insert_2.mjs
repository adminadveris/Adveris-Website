import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uzzextbwpudmjpsyyziq.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6emV4dGJ3cHVkbWpwc3l5emlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyMTUyOCwiZXhwIjoyMDkxMzk3NTI4fQ.O53QhUGakVNTL_k4lGYc7d_ip09CTgKomXNeOibwzYY';

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function testInsert() {
  console.log('--- Testing Insert with full_name into User ---');
  const dummyId = '00000000-0000-0000-0000-000000000002';
  const { error } = await admin
    .from('User')
    .insert({
      id: dummyId,
      email: 'test2@minimal.com',
      full_name: 'Test User'
    });

  if (error) {
    console.error('❌ Insert Failed:', error.message);
  } else {
    console.log('✅ Insert with full_name succeeded.');
    await admin.from('User').delete().eq('id', dummyId);
  }
}

testInsert().catch(console.error);
