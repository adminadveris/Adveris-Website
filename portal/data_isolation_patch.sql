-- ==========================================
-- DATA PRIVACY & ISOLATION PATCH (ADV-PRIV-001)
-- ==========================================

-- 1. Harden Accounts Table Isolation
-- Only Admins/Employees can see all accounts. Clients only see their own.
DROP POLICY IF EXISTS "Allow all authenticated users to view accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow users to view their own accounts" ON public.accounts;

CREATE POLICY "Admin/Employee View All Accounts" 
ON public.accounts 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid() AND u.role IN ('admin', 'employee'))
);

CREATE POLICY "Client View Own Account" 
ON public.accounts 
FOR SELECT 
TO authenticated 
USING (
    id IN (SELECT account_id FROM public."User" WHERE id = auth.uid())
);

-- 2. Harden Request Table Isolation
-- Ensure one client cannot see another client's mandates.
DROP POLICY IF EXISTS "Allow users to view their own requests" ON public."Request";

CREATE POLICY "Admin/Employee View All Requests" 
ON public."Request" 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid() AND u.role IN ('admin', 'employee'))
);

CREATE POLICY "Client View Own Requests" 
ON public."Request" 
FOR SELECT 
TO authenticated 
USING (
    submitted_by = auth.uid() OR 
    account_id IN (SELECT account_id FROM public."User" WHERE id = auth.uid())
);

-- 3. Harden Operational Data (Timesheets & Expenses)
-- Only creators (Staff) or Admins can see these. 
-- Clients are blocked from internal cost data.

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff/Admin View Operational Data" ON public.timesheets;
CREATE POLICY "Staff/Admin View Operational Data" 
ON public.timesheets 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid() AND u.role IN ('admin', 'employee'))
);

DROP POLICY IF EXISTS "Staff/Admin View Expenses" ON public.expenses;
CREATE POLICY "Staff/Admin View Expenses" 
ON public.expenses 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid() AND u.role IN ('admin', 'employee'))
);

-- 4. Harden User Table Isolation
-- This prevents clients from browsing other users' emails/names.
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view for User" ON public."User";
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public."User";

CREATE POLICY "Admin/Employee View All Users" 
ON public."User" 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public."User" u WHERE u.id = auth.uid() AND u.role IN ('admin', 'employee'))
);

CREATE POLICY "User View Own Profile" 
ON public."User" 
FOR SELECT 
TO authenticated 
USING (
    id = auth.uid()
);
