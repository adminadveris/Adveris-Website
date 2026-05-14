-- ==========================================
-- ADVERIS PORTAL: USER PROFILE HARDENING (v1.4)
-- Objective: Allow users to update their own profiles (e.g., account linkage)
-- ==========================================

-- 1. ENABLE RLS ON USER TABLE (Case sensitive "User")
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- 2. CREATE UPDATE POLICY
DROP POLICY IF EXISTS "user_update_policy" ON public."User";
CREATE POLICY "user_update_policy" ON public."User" FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. ENSURE SELECT POLICY EXISTS
DROP POLICY IF EXISTS "user_select_policy" ON public."User";
CREATE POLICY "user_select_policy" ON public."User" FOR SELECT TO authenticated
USING (id = auth.uid() OR (SELECT role FROM public."User" WHERE id = auth.uid()) IN ('admin', 'employee'));

-- 4. RELOAD
NOTIFY pgrst, 'reload schema';
