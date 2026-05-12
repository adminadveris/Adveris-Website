import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uzzextbwpudmjpsyyziq.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6emV4dGJ3cHVkbWpwc3l5emlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyMTUyOCwiZXhwIjoyMDkxMzk3NTI4fQ.O53QhUGakVNTL_k4lGYc7d_ip09CTgKomXNeOibwzYY';

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function testInsert() {
  console.log('--- Testing Minimal Insert into User ---');
  const dummyId = '00000000-0000-0000-0000-000000000001';
  const { error } = await admin
    .from('User')
    .insert({
      id: dummyId,
      email: 'test@minimal.com'
    });

  if (error) {
    console.error('❌ Insert Failed:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
  } else {
    console.log('✅ Minimal insert succeeded. ID and Email are sufficient.');
    await admin.from('User').delete().eq('id', dummyId);
  }
}

testInsert().catch(console.error);
