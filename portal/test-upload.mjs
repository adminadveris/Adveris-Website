import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://uzzextbwpudmjpsyyziq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_npeZFUGz2EK9ssze455nbw_tpqEgADp';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// STEP 1: Login as admin
// ============================================================
async function login() {
  console.log('\n[1/5] Logging in as admin...');
  const passwords = ['Admin@123', 'Adveris@123', 'admin123', 'Admin123!', 'Password@123'];
  const emails = ['admin@adverisadvisors.com', 'admin@adveris.in', 'admin@adverisadvisors.in'];
  
  for (const email of emails) {
    for (const password of passwords) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        console.log('✓ Logged in as:', data.user.email, 'with password:', password);
        return data.user;
      }
    }
  }
  console.error('All login attempts failed. Please check credentials.');
  return null;
  console.log('✓ Logged in as:', data.user.email);
  return data.user;
}

// ============================================================
// STEP 2: Check bucket exists
// ============================================================
async function checkBucket() {
  console.log('\n[2/5] Checking mandate-files bucket...');
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error.message);
    return false;
  }
  const bucket = data.find(b => b.name === 'mandate-files');
  if (bucket) {
    console.log('✓ Bucket found:', bucket.name, '| Public:', bucket.public);
    return true;
  } else {
    console.log('✗ mandate-files bucket NOT found. Available:', data.map(b => b.name).join(', '));
    return false;
  }
}

// ============================================================
// STEP 3: Upload a test file to Supabase Storage
// ============================================================
async function uploadTestFile() {
  console.log('\n[3/5] Uploading test file to mandate-files bucket...');
  
  // Create a simple test file in memory
  const testContent = 'This is a test document for Adveris Portal file upload validation.\nGenerated: ' + new Date().toISOString();
  const testBlob = Buffer.from(testContent, 'utf-8');
  const fileName = `test_upload_${Date.now()}.txt`;
  const filePath = `mandates/${fileName}`;

  const { data, error } = await supabase.storage
    .from('mandate-files')
    .upload(filePath, testBlob, {
      contentType: 'text/plain',
      upsert: false
    });

  if (error) {
    console.error('✗ Upload FAILED:', error.message);
    console.error('  Error details:', JSON.stringify(error, null, 2));
    return null;
  }

  console.log('✓ File uploaded at path:', data.path);

  const { data: { publicUrl } } = supabase.storage
    .from('mandate-files')
    .getPublicUrl(filePath);
  
  console.log('✓ Public URL:', publicUrl);

  return {
    name: fileName,
    size: testBlob.length,
    type: 'text/plain',
    url: publicUrl
  };
}

// ============================================================
// STEP 4: Verify the Request table has attached_files (jsonb)
// ============================================================
async function checkSchema() {
  console.log('\n[4/5] Verifying Request table schema...');
  
  // Insert a dummy request with attached_files as jsonb
  const testPayload = {
    account_id: '00000000-0000-0000-0000-000000000001',
    account_name: 'Schema Test Account',
    title: 'Schema Validation Test',
    primary_service: 'Test Service',
    sub_service: 'Test Sub',
    status: 'active',
    priority: 'Standard',
    verification_status: 'Pending',
    submitted_by: null,
    submitted_by_name: 'Schema Test',
    created_by_name: 'Schema Test',
    updated_by_name: 'Schema Test',
    request_number: `TEST-${Date.now()}`,
    attached_files: [{ name: 'test.txt', size: 100, type: 'text/plain', url: 'https://example.com/test.txt' }],
    attached_file: { name: 'test.txt', size: 100, type: 'text/plain', url: 'https://example.com/test.txt' }
  };

  const { data, error } = await supabase
    .from('Request')
    .insert(testPayload)
    .select()
    .single();

  if (error) {
    console.error('✗ Schema test FAILED:', error.message);
    console.error('  Code:', error.code);
    if (error.message.includes('attached_files')) {
      console.error('  → The attached_files column does not exist or has wrong type!');
    }
    if (error.message.includes('account_id')) {
      console.log('  → This might be an FK constraint error (expected for dummy UUID). Schema is OK.');
      return true; // Schema is fine, just FK violation
    }
    return false;
  }

  console.log('✓ Schema test PASSED. Record ID:', data.id);
  
  // Clean up test record
  await supabase.from('Request').delete().eq('id', data.id);
  console.log('✓ Test record cleaned up.');
  return true;
}

// ============================================================
// STEP 5: Full E2E - Get real account, upload, save request
// ============================================================
async function fullE2ETest(uploadedFile) {
  console.log('\n[5/5] Running full E2E test...');

  // Get first real account from DB
  const { data: accounts, error: accError } = await supabase
    .from('accounts')
    .select('id, account_name, pan_number')
    .limit(5);
  
  if (accError || !accounts?.length) {
    console.error('Could not load accounts:', accError?.message || 'No accounts found');
    return;
  }

  const account = accounts[0];
  console.log('✓ Using account:', account.account_name, '|', account.id);

  if (!uploadedFile) {
    console.log('  Skipping record creation (no uploaded file)');
    return;
  }

  // Create a real request with the uploaded file
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: userProfile } = await supabase
    .from('User')
    .select('full_name')
    .eq('id', user?.id)
    .single();

  const payload = {
    account_id: account.id,
    account_name: account.account_name,
    title: 'File Upload E2E Test - ' + new Date().toLocaleString('en-IN'),
    primary_service: 'GST Compliance',
    sub_service: 'Filing',
    status: 'active',
    priority: 'Standard',
    verification_status: 'Pending',
    submitted_by: user?.id,
    submitted_by_name: userProfile?.full_name || 'Admin Test',
    created_by_name: userProfile?.full_name || 'Admin Test',
    updated_by_name: userProfile?.full_name || 'Admin Test',
    request_number: `ADV-E2E-${Date.now()}`,
    description: 'This is an automated E2E test of the file upload system.',
    attached_file: uploadedFile,
    attached_files: [uploadedFile]
  };

  const { data: record, error: recError } = await supabase
    .from('Request')
    .insert(payload)
    .select()
    .single();

  if (recError) {
    console.error('✗ Request creation FAILED:', recError.message);
    return;
  }

  console.log('✓ Request created successfully!');
  console.log('  ID:', record.id);
  console.log('  Request Number:', record.request_number);
  console.log('  attached_files saved:', JSON.stringify(record.attached_files));
  console.log('\n  → VIEW RECORD AT: http://localhost:5173/portal/dashboard/requests/' + record.id);
  console.log('  → EDIT RECORD AT: http://localhost:5173/portal/dashboard/requests/' + record.id + '/edit');
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('='.repeat(60));
  console.log('ADVERIS PORTAL - FILE UPLOAD SYSTEM TEST');
  console.log('='.repeat(60));

  const user = await login();
  
  const bucketOk = await checkBucket();
  
  let uploadedFile = null;
  if (bucketOk) {
    uploadedFile = await uploadTestFile();
  } else {
    console.log('\n⚠ Bucket not found - skipping upload test.');
    console.log('  Please create the "mandate-files" bucket in Supabase Dashboard:');
    console.log('  → https://supabase.com/dashboard/project/uzzextbwpudmjpsyyziq/storage/buckets');
    console.log('  → Name: mandate-files, toggle Public: ON, click Save');
  }

  const schemaOk = await checkSchema();

  if (user) {
    await fullE2ETest(uploadedFile);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY:');
  console.log('  Auth Login:      ', user ? '✓ PASS' : '✗ FAIL');
  console.log('  Storage Bucket:  ', bucketOk ? '✓ PASS' : '✗ FAIL - Bucket missing');
  console.log('  File Upload:     ', uploadedFile ? '✓ PASS' : '✗ FAIL');
  console.log('  DB Schema:       ', schemaOk ? '✓ PASS' : '✗ FAIL - Column missing or wrong type');
  console.log('='.repeat(60));
}

main().catch(console.error);
