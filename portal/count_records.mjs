import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { count: accCount, error: accErr } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
    const { count: reqCount, error: reqErr } = await supabase.from('Request').select('*', { count: 'exact', head: true });
    
    console.log('--- DATABASE STATUS ---');
    console.log('Accounts Count:', accCount);
    if (accErr) console.error('Accounts Error:', accErr.message);
    
    console.log('Requests Count:', reqCount);
    if (reqErr) console.error('Requests Error:', reqErr.message);
}

check();
