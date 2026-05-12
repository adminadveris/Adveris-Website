-- ==========================================
-- ADVERIS PORTAL: GLOBAL RELATIONAL REFACTOR (v1.8)
-- Objective: Universal conversion from text auditing to IDs
-- ==========================================

-- 1. CLIENTS
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public."User"(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES public."User"(id);

-- 2. TIMESHEETS
ALTER TABLE public.timesheets ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public."User"(id);
ALTER TABLE public.timesheets ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES public."User"(id);
-- Also ensure user_id is properly linked (already exists but for safety)

-- 3. EXPENSES
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public."User"(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES public."User"(id);

-- 4. NOTIFICATIONS
ALTER TABLE public."Notification" ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public."User"(id);

-- 5. BACKFILL
-- Clients: Use created_at logic or first admin found
UPDATE public.clients SET created_by_id = (SELECT id FROM public."User" WHERE role = 'admin' LIMIT 1) WHERE created_by_id IS NULL;
UPDATE public.clients SET updated_by_id = created_by_id WHERE updated_by_id IS NULL;

-- Timesheets: Use existing user_id as the creator
UPDATE public.timesheets SET created_by_id = user_id WHERE created_by_id IS NULL;
UPDATE public.timesheets SET updated_by_id = user_id WHERE updated_by_id IS NULL;

-- Expenses: Use existing user_id as the creator
UPDATE public.expenses SET created_by_id = user_id WHERE created_by_id IS NULL;
UPDATE public.expenses SET updated_by_id = user_id WHERE updated_by_id IS NULL;

-- 6. RELOAD
NOTIFY pgrst, 'reload schema';
