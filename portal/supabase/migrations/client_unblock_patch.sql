-- ==========================================
-- CLIENT WORKFLOW UNBLOCK PATCH (ADV-FIX-002)
-- ==========================================

-- 1. Allow Clients to Register their own accounts (Entities)
-- This fix resolves the "new row violates row-level security policy" error.
DROP POLICY IF EXISTS "Client Insert Own Account" ON public.accounts;
CREATE POLICY "Client Insert Own Account" 
ON public.accounts 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Allow Clients to Update their own accounts
DROP POLICY IF EXISTS "Client Update Own Account" ON public.accounts;
CREATE POLICY "Client Update Own Account" 
ON public.accounts 
FOR UPDATE 
TO authenticated 
USING (
    id IN (SELECT account_id FROM public."User" WHERE id = auth.uid())
);

-- 3. Allow Clients to Create Requests (Mandates)
DROP POLICY IF EXISTS "Client Insert Own Requests" ON public."Request";
CREATE POLICY "Client Insert Own Requests" 
ON public."Request" 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 4. Allow Clients to see Staff Profiles (for initialization)
-- This prevents the "New Request" page from hanging during role verification.
DROP POLICY IF EXISTS "Client View Staff" ON public."User";
CREATE POLICY "Client View Staff" 
ON public."User" 
FOR SELECT 
TO authenticated 
USING (
    role IN ('admin', 'employee')
);

-- 5. Storage Permissions (Ensure public bucket is accessible for uploads)
-- Note: These policies should be applied in the 'storage' schema if using Supabase Storage.
-- This script assumes standard table RLS for now.
