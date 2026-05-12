-- ==========================================
-- SCHEMA ALIGNMENT PATCH (ADV-DB-002)
-- Objective: Ensure accounts table supports full statutory & address grid
-- ==========================================

ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS cin_number TEXT,
ADD COLUMN IF NOT EXISTS gstin_number TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS house_no TEXT,
ADD COLUMN IF NOT EXISTS street_1 TEXT,
ADD COLUMN IF NOT EXISTS street_2 TEXT,
ADD COLUMN IF NOT EXISTS street_3 TEXT,
ADD COLUMN IF NOT EXISTS landmark TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';

-- Verify the columns are visible to the schema cache
NOTIFY pgrst, 'reload schema';
