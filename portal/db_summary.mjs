import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uzzextbwpudmjpsyyziq.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6emV4dGJ3cHVkbWpwc3l5emlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyMTUyOCwiZXhwIjoyMDkxMzk3NTI4fQ.O53QhUGakVNTL_k4lGYc7d_ip09CTgKomXNeOibwzYY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
    console.log('--- DB SUMMARY ---');
    
    const { count: accCount, data: accData } = await supabase.from('accounts').select('*', { count: 'exact' });
    console.log('Accounts:', accCount, accData?.[0] ? '(Sample: ' + accData[0].account_name + ')' : '(Empty)');
    
    const { count: reqCount, data: reqData } = await supabase.from('Request').select('*', { count: 'exact' });
    console.log('Requests:', reqCount, reqData?.[0] ? '(Sample: ' + reqData[0].title + ')' : '(Empty)');
}

run().catch(console.error);
