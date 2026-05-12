-- ==========================================
-- ADVERIS PORTAL: CRITICAL SECURITY PATCH (v1.6)
-- Objective: Fix data leakage (clients seeing other clients' data)
-- ==========================================

-- 1. ENFORCE RLS (This is the most likely gap)
ALTER TABLE public."Request" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 2. WIPE AND REBUILD POLICIES FOR REQUEST
DROP POLICY IF EXISTS "requests_select_policy" ON public."Request";
DROP POLICY IF EXISTS "Select all for authenticated" ON public."Request";
DROP POLICY IF EXISTS "Enable read access for all users" ON public."Request";

-- THE SECURE POLICY
CREATE POLICY "requests_select_policy" ON public."Request" FOR SELECT TO authenticated
USING (
  -- 1. Staff can see everything
  (SELECT role FROM public."User" WHERE id = auth.uid()) IN ('admin', 'employee')
  -- 2. Client can see mandates they explicitly submitted
  OR submitted_by = auth.uid() 
  -- 3. Client can see mandates linked to their registered account
  OR account_id IN (SELECT account_id FROM public."User" WHERE id = auth.uid())
);

-- 3. WIPE AND REBUILD POLICIES FOR ACCOUNTS
DROP POLICY IF EXISTS "accounts_select_policy" ON public.accounts;
CREATE POLICY "accounts_select_policy" ON public.accounts FOR SELECT TO authenticated
USING (
  (SELECT role FROM public."User" WHERE id = auth.uid()) IN ('admin', 'employee')
  OR id IN (SELECT account_id FROM public."User" WHERE id = auth.uid())
  OR created_by_id = auth.uid()
);

-- 4. RELOAD
NOTIFY pgrst, 'reload schema';
