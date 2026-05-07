import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  'https://uzzextbwpudmjpsyyziq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6emV4dGJ3cHVkbWpwc3l5emlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyMTUyOCwiZXhwIjoyMDkxMzk3NTI4fQ.O53QhUGakVNTL_k4lGYc7d_ip09CTgKomXNeOibwzYY',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function cleanup() {
  console.log('Cleaning up ADV-TEST-* records...');

  // 1. Find all test records
  const { data: testRecords, error } = await admin
    .from('Request')
    .select('id, request_number, attached_files, attached_file')
    .like('request_number', 'ADV-TEST-%');

  if (error) { console.error('Query failed:', error.message); return; }
  if (!testRecords?.length) { console.log('No test records found.'); return; }

  console.log(`Found ${testRecords.length} test record(s):`);
  testRecords.forEach(r => console.log(`  - ${r.request_number} (${r.id})`));

  // 2. Collect all storage paths to delete
  const storagePaths = [];
  for (const rec of testRecords) {
    const files = [
      ...(Array.isArray(rec.attached_files) ? rec.attached_files : []),
      ...(rec.attached_file ? [rec.attached_file] : [])
    ];
    for (const f of files) {
      if (f?.url) {
        // Extract path after /object/public/mandate-files/
        const match = f.url.match(/\/object\/public\/mandate-files\/(.+)/);
        if (match) storagePaths.push(match[1]);
      }
    }
  }

  // 3. Delete storage objects
  if (storagePaths.length > 0) {
    console.log(`\nDeleting ${storagePaths.length} storage file(s)...`);
    const { error: storErr } = await admin.storage
      .from('mandate-files')
      .remove(storagePaths);
    if (storErr) console.warn('Storage delete warning:', storErr.message);
    else console.log('  ✓ Storage files deleted');
  }

  // 4. Delete test records from DB
  const ids = testRecords.map(r => r.id);
  const { error: delErr } = await admin
    .from('Request')
    .delete()
    .in('id', ids);

  if (delErr) console.error('DB delete failed:', delErr.message);
  else console.log(`  ✓ ${ids.length} test record(s) deleted from DB`);

  // 5. Also delete any orphan test files from storage
  console.log('\nListing remaining test files in storage...');
  const { data: storageFiles } = await admin.storage
    .from('mandate-files')
    .list('mandates', { search: 'upload_test' });

  if (storageFiles?.length) {
    const orphanPaths = storageFiles.map(f => `mandates/${f.name}`);
    console.log(`Deleting ${orphanPaths.length} orphan test file(s)...`);
    await admin.storage.from('mandate-files').remove(orphanPaths);
    console.log('  ✓ Orphan files deleted');
  } else {
    console.log('  ✓ No orphan test files found');
  }

  console.log('\n✓ Cleanup complete.');
}

cleanup().catch(console.error);
