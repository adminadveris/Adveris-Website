import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uzzextbwpudmjpsyyziq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6emV4dGJ3cHVkbWpwc3l5emlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjE1MjgsImV4cCI6MjA5MTM5NzUyOH0.X0Jgz5n2yECEk9fO7SC-eJIefSNFbTTQG07C5qZMuxM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('--- UPDATE ACCOUNT TEST ---\n');

  // 1. Sign in as admin
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@adverisadvisors.com',
    password: 'Adminadveris@1990'
  });
  if (authErr) { console.error('AUTH ERROR:', authErr.message); return; }
  console.log('✅ Logged in as:', auth.user.email);

  // 2. Get first account
  const { data: accounts, error: accErr } = await supabase.from('accounts').select('id, account_name').limit(1);
  if (accErr) { console.error('GET ACCOUNTS ERROR:', accErr.message); return; }
  const acc = accounts[0];
  console.log('✅ Got account:', acc.account_name, '| id:', acc.id);

  // 3. Try update
  const { data: updated, error: updateErr } = await supabase
    .from('accounts')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', acc.id)
    .select()
    .single();

  if (updateErr) {
    console.error('❌ UPDATE ERROR:', updateErr.message);
    console.error('   Code:', updateErr.code);
    console.error('   Details:', updateErr.details);
    console.error('   Hint:', updateErr.hint);
  } else {
    console.log('✅ UPDATE SUCCESS — account_name:', updated.account_name);
  }

  // 4. Try audit log insert
  const { error: auditErr } = await supabase.from('audit_logs').insert({
    table_name: 'accounts',
    record_id: acc.id,
    action: 'TEST',
    field_name: 'details',
    new_value: 'Test audit log',
    changed_by: auth.user.id,
    changed_by_name: 'Test'
  });
  if (auditErr) {
    console.error('❌ AUDIT LOG ERROR:', auditErr.message, auditErr.code);
  } else {
    console.log('✅ AUDIT LOG INSERT SUCCESS');
  }
}

test();
