
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uzzextbwpudmjpsyyziq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6emV4dGJ3cHVkbWpwc3l5emlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjE1MjgsImV4cCI6MjA5MTM5NzUyOH0.X0Jgz5n2yECEk9fO7SC-eJIefSNFbTTQG07C5qZMuxM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- DB CONNECTION TEST ---');
  
  const { data: users, error: userError } = await supabase.from('User').select('id, full_name').limit(1);
  if (userError) {
    console.error('Error fetching from "User":', userError);
  } else {
    console.log('Success! Found User:', users[0]?.full_name);
  }

  const { data: requests, error: reqError } = await supabase.from('Request').select('id, request_number').limit(1);
  if (reqError) {
    console.error('Error fetching from "Request":', reqError);
  } else {
    console.log('Success! Found Request:', requests[0]?.request_number);
  }
}

check();
