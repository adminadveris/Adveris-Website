-- ==========================================
-- ADVERIS PORTAL: RELATIONAL INTEGRITY REFACTOR (v1.7)
-- Objective: Move from text-based auditing to Foreign Key relationships
-- ==========================================

-- 1. REFRESH SCHEMA FOR REQUEST
ALTER TABLE public."Request" ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public."User"(id);
ALTER TABLE public."Request" ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES public."User"(id);

-- Backfill existing records
UPDATE public."Request" SET created_by_id = submitted_by WHERE created_by_id IS NULL;
UPDATE public."Request" SET updated_by_id = submitted_by WHERE updated_by_id IS NULL;

-- 2. REFRESH SCHEMA FOR ACCOUNTS (Case sensitive "accounts")
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public."User"(id);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES public."User"(id);

-- 3. REFRESH SCHEMA FOR TIMESHEETS
ALTER TABLE public.timesheets ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public."User"(id);
ALTER TABLE public.timesheets ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES public."User"(id);

-- 4. REFRESH SCHEMA FOR EXPENSES
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public."User"(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES public."User"(id);

-- 5. RELOAD
NOTIFY pgrst, 'reload schema';
