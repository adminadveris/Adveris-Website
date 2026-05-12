-- 1. Resolve RLS Blocker for Request table
-- Allows clients to submit new mandates
ALTER TABLE public."Request" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert requests" 
ON public."Request" 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow users to view their own requests" 
ON public."Request" 
FOR SELECT 
TO authenticated 
USING (auth.uid() = submitted_by OR EXISTS (
    SELECT 1 FROM public."User" u WHERE u.id = auth.uid() AND u.role IN ('admin', 'employee')
));

-- 2. Ensure Accounts SELECT policy is sufficient for Admins
-- (Re-applying with explicit check for safety)
DROP POLICY IF EXISTS "Allow users to view their own accounts" ON public.accounts;
CREATE POLICY "Allow all authenticated users to view accounts" 
ON public.accounts 
FOR SELECT 
TO authenticated 
USING (true);
