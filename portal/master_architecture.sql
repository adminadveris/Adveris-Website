-- ==========================================
-- ADVERIS PORTAL: MASTER ARCHITECTURE (v1.1)
-- Objective: Unified Security, Role-Based Access, and Data Integrity
-- ==========================================

-- PRE-CLEANUP: Clear all legacy & newly named policies (Idempotent)
DROP POLICY IF EXISTS "Admin/Employee View All Accounts" ON public.accounts;
DROP POLICY IF EXISTS "Client View Own Account" ON public.accounts;
DROP POLICY IF EXISTS "Client Insert Own Account" ON public.accounts;
DROP POLICY IF EXISTS "Client Update Own Account" ON public.accounts;
DROP POLICY IF EXISTS "accounts_select_policy" ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert_policy" ON public.accounts;
DROP POLICY IF EXISTS "accounts_update_policy" ON public.accounts;

DROP POLICY IF EXISTS "Admin/Employee View All Requests" ON public."Request";
DROP POLICY IF EXISTS "Client View Own Requests" ON public."Request";
DROP POLICY IF EXISTS "Client Insert Own Requests" ON public."Request";
DROP POLICY IF EXISTS "requests_select_policy" ON public."Request";
DROP POLICY IF EXISTS "requests_insert_policy" ON public."Request";
DROP POLICY IF EXISTS "requests_update_policy" ON public."Request";

DROP POLICY IF EXISTS "Staff/Admin View Operational Data" ON public.timesheets;
DROP POLICY IF EXISTS "operational_access_policy" ON public.timesheets;

DROP POLICY IF EXISTS "Staff/Admin View Expenses" ON public.expenses;
DROP POLICY IF EXISTS "expense_access_policy" ON public.expenses;

DROP POLICY IF EXISTS "Admin/Employee View All Users" ON public."User";
DROP POLICY IF EXISTS "User View Own Profile" ON public."User";
DROP POLICY IF EXISTS "Client View Staff" ON public."User";
DROP POLICY IF EXISTS "user_directory_policy" ON public."User";
DROP POLICY IF EXISTS "user_self_update_policy" ON public."User";

-- ==========================================
-- 1. RECURSION GUARD (SECURITY DEFINER)
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT role FROM public."User" WHERE id = auth.uid()) IN ('admin', 'employee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. ACCOUNTS (CRM)
-- ==========================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select_policy" ON public.accounts FOR SELECT TO authenticated
USING (public.is_staff() OR id IN (SELECT account_id FROM public."User" WHERE id = auth.uid()));

CREATE POLICY "accounts_insert_policy" ON public.accounts FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "accounts_update_policy" ON public.accounts FOR UPDATE TO authenticated
USING (public.is_staff() OR id IN (SELECT account_id FROM public."User" WHERE id = auth.uid()));

-- ==========================================
-- 3. REQUESTS (MANDATES)
-- ==========================================
ALTER TABLE public."Request" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requests_select_policy" ON public."Request" FOR SELECT TO authenticated
USING (public.is_staff() OR submitted_by = auth.uid() OR account_id IN (SELECT account_id FROM public."User" WHERE id = auth.uid()));

CREATE POLICY "requests_insert_policy" ON public."Request" FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "requests_update_policy" ON public."Request" FOR UPDATE TO authenticated
USING (public.is_staff() OR (submitted_by = auth.uid() AND status = 'active'));

-- ==========================================
-- 4. OPERATIONAL DATA
-- ==========================================
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operational_access_policy" ON public.timesheets FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY "expense_access_policy" ON public.expenses FOR ALL TO authenticated USING (public.is_staff());

-- ==========================================
-- 5. USER DIRECTORY
-- ==========================================
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_directory_policy" ON public."User" FOR SELECT TO authenticated
USING (public.is_staff() OR id = auth.uid() OR role IN ('admin', 'employee'));

CREATE POLICY "user_self_update_policy" ON public."User" FOR UPDATE TO authenticated
USING (id = auth.uid());
