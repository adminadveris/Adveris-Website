-- ==========================================
-- ADVERIS PORTAL: FINAL RLS HARDENING (v1.2)
-- Objective: Fix account registration & storage upload blockers
-- ==========================================

-- 1. ENHANCE ACCOUNTS TABLE
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS created_by_id UUID DEFAULT auth.uid();

-- 2. REFRESH ACCOUNT POLICIES (Idempotent)
DROP POLICY IF EXISTS "accounts_select_policy" ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert_policy" ON public.accounts;

-- SELECT: Staff see all. Clients see their linked account OR accounts they created.
CREATE POLICY "accounts_select_policy" ON public.accounts FOR SELECT TO authenticated
USING (
  public.is_staff() 
  OR id IN (SELECT account_id FROM public."User" WHERE id = auth.uid())
  OR created_by_id = auth.uid()
);

-- INSERT: Authenticated users can create accounts. 
CREATE POLICY "accounts_insert_policy" ON public.accounts FOR INSERT TO authenticated
WITH CHECK (true);

-- 3. AUDIT LOGS SECURITY
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- 4. STORAGE BUCKET PERMISSIONS (mandate-files)
-- Note: These run on the storage schema
CREATE POLICY "Allow Authenticated Uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'mandate-files');

CREATE POLICY "Allow Authenticated Downloads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'mandate-files');

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
