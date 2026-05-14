-- ==========================================
-- ADVERIS PORTAL: REQUEST TABLE ALIGNMENT (v1.3)
-- Objective: Resolve mandate submission blockers and select errors
-- ==========================================

-- 1. ALIGN COLUMNS
-- Ensure title and sub_service are present and have defaults if needed
ALTER TABLE public."Request" ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public."Request" ADD COLUMN IF NOT EXISTS sub_service TEXT;

-- Update existing records to have a default title if null (prevents 400 errors on select if constraint is strict)
UPDATE public."Request" SET title = 'Mandate Request' WHERE title IS NULL;
UPDATE public."Request" SET sub_service = 'General Advisory' WHERE sub_service IS NULL;

-- 2. HARDEN RLS (Simpler, non-recursive)
DROP POLICY IF EXISTS "requests_select_policy" ON public."Request";
CREATE POLICY "requests_select_policy" ON public."Request" FOR SELECT TO authenticated
USING (
  (SELECT role FROM public."User" WHERE id = auth.uid()) IN ('admin', 'employee')
  OR submitted_by = auth.uid() 
  OR account_id IN (SELECT account_id FROM public."User" WHERE id = auth.uid())
);

-- 3. RELOAD
NOTIFY pgrst, 'reload schema';
