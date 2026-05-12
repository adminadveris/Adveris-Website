import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uzzextbwpudmjpsyyziq.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6emV4dGJ3cHVkbWpwc3l5emlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyMTUyOCwiZXhwIjoyMDkxMzk3NTI4fQ.O53QhUGakVNTL_k4lGYc7d_ip09CTgKomXNeOibwzYY';

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function provisionUser(email, firstName, lastName, role) {
  console.log(`--- Provisioning ${role}: ${email} ---`);
  
  // 1. Create User in Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      role: role
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('User already exists in Auth. Checking Profile...');
    } else {
        console.error('❌ Auth Creation Failed:', authError.message);
        return;
    }
  }

  const userId = authData?.user?.id;
  
  // 2. Upsert Profile in User table
  if (userId) {
      const { error: profileError } = await admin
        .from('User')
        .upsert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          role: role,
          status: 'approved'
        });

      if (profileError) {
        console.error('❌ Profile Creation Failed:', profileError.message);
      } else {
        console.log(`✅ ${role} provisioned successfully.`);
      }
  } else {
      // If user exists, find them and update profile to be sure
      const { data: existingUser } = await admin.from('User').select('id').eq('email', email).single();
      if (existingUser) {
           await admin
            .from('User')
            .update({ role, status: 'approved' })
            .eq('id', existingUser.id);
           console.log(`✅ Existing ${role} profile updated to approved.`);
      }
  }
}

async function run() {
    await provisionUser('client_1@adveris.com', 'Primary', 'Client', 'client');
    await provisionUser('client_2@adveris.com', 'Secondary', 'Client', 'client');
    await provisionUser('admin_1@adveris.com', 'System', 'Admin', 'admin');
    await provisionUser('employee_1@adveris.com', 'Junior', 'Staff', 'employee');
}

run().catch(console.error);
