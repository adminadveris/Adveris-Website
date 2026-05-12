import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uzzextbwpudmjpsyyziq.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6emV4dGJ3cHVkbWpwc3l5emlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyMTUyOCwiZXhwIjoyMDkxMzk3NTI4fQ.O53QhUGakVNTL_k4lGYc7d_ip09CTgKomXNeOibwzYY';

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function inspect(table) {
  console.log(`--- Inspecting Table: ${table} ---`);
  const { data, error } = await admin
    .from(table)
    .select('*')
    .limit(1);

  if (error) {
    console.error(`❌ Table ${table} Inspection Failed:`, error.message);
  } else {
    const keys = data[0] ? Object.keys(data[0]) : [];
    console.log(`✅ Found ${table} record(s). Columns:`, keys);
    if (data[0]) console.log('Sample record summary:', JSON.stringify(data[0]).substring(0, 200) + '...');
    else console.log('Table is empty.');
  }
}

async function run() {
    await inspect('accounts');
    await inspect('Request');
}

run().catch(console.error);
