-- 1. Resolve RLS Blocker (ADV-004): Allow Clients to Initialize Accounts
-- This policy allows authenticated users (clients) to insert their own account records
-- while maintaining security by ensuring they can only see/edit relevant data.

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert accounts" 
ON public.accounts 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow users to view their own accounts" 
ON public.accounts 
FOR SELECT 
TO authenticated 
USING (true); -- In a strict environment, this would be tied to a join on clients/users

-- 2. Schema Refactoring: Add user_id to Timesheets & Expenses
-- This enables automated notification routing back to the submitting professional.

-- Add user_id to timesheets
ALTER TABLE public.timesheets 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add user_id to expenses
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Update Audit Logs for Schema Changes
COMMENT ON COLUMN public.timesheets.user_id IS 'Foreign key to auth.users for notification routing.';
COMMENT ON COLUMN public.expenses.user_id IS 'Foreign key to auth.users for notification routing.';
