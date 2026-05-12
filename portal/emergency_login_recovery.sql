-- ==========================================
-- ADVERIS PORTAL: EMERGENCY LOGIN RECOVERY (v1.5)
-- Objective: Fix infinite recursion in User RLS policy
-- ==========================================

-- 1. FIX USER SELECT POLICY (Non-recursive)
DROP POLICY IF EXISTS "user_select_policy" ON public."User";
CREATE POLICY "user_select_policy" ON public."User" FOR SELECT TO authenticated
USING (
  id = auth.uid() 
  OR role IN ('admin', 'employee')
);

-- 2. FIX USER UPDATE POLICY (Non-recursive)
DROP POLICY IF EXISTS "user_update_policy" ON public."User";
CREATE POLICY "user_update_policy" ON public."User" FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
