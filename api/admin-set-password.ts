import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function: Admin Set Password
// This uses the Supabase service role key (server-side only) to change any user's password.

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers for portal requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey
    });
    return res.status(500).json({ error: 'Server configuration error. Required environment variables are missing.' });
  }

  // Extract the caller's JWT from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Missing authentication token.' });
  }

  const token = authHeader.replace('Bearer ', '');

  // Parse request body
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields: userId and newPassword.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    // Step 1: Verify the caller is an admin using their JWT
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user: callerAuth }, error: authError } = await anonClient.auth.getUser();

    if (authError || !callerAuth) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    // Check caller's role in the User table
    const { data: callerProfile, error: profileError } = await anonClient
      .from('User')
      .select('role')
      .eq('id', callerAuth.id)
      .single();

    if (profileError || !callerProfile) {
      return res.status(403).json({ error: 'Unable to verify your admin privileges.' });
    }

    if (callerProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Governance restriction: Only administrators can set user passwords.' });
    }

    // Prevent admin from setting their own password through this endpoint
    // (they should use the normal password change flow)
    if (callerAuth.id === userId) {
      return res.status(400).json({ error: 'Cannot set your own password through admin console. Use the profile settings instead.' });
    }

    // Step 2: Use the service role key to update the target user's password
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ error: updateError.message || 'Failed to update password.' });
    }

    // Step 3: Log the action (using the anon client with the admin's token)
    // We use a fresh client authenticated as the admin caller
    try {
      const { data: targetUser } = await anonClient
        .from('User')
        .select('full_name, email')
        .eq('id', userId)
        .single();

      await anonClient
        .from('audit_logs')
        .insert({
          table_name: 'User',
          record_id: userId,
          action: 'ADMIN_SET_PASSWORD',
          field_name: 'password',
          new_value: `Password manually set by admin for: ${targetUser?.email || userId}`,
          changed_by: callerAuth.id,
          changed_by_name: callerAuth.user_metadata?.full_name || 'Admin'
        });
    } catch (auditErr) {
      // Don't fail the request if audit logging fails
      console.warn('Audit log failed:', auditErr);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Password updated successfully.' 
    });

  } catch (err: any) {
    console.error('Admin set password error:', err);
    return res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
  }
}
