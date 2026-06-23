-- ============================================
-- PATCH: Create invoice_senders table and update invoices
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Create invoice_senders table
CREATE TABLE IF NOT EXISTS invoice_senders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT NOT NULL,
  zip_postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  logo_key TEXT, -- Logo URL or relative path/filename e.g., 'https://example.com/logo.png'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE invoice_senders ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can view active senders
CREATE POLICY "Authenticated users can view invoice senders" ON invoice_senders
  FOR SELECT USING (true);

-- Policy 2: Staff (admin/employee) can manage all senders
CREATE POLICY "Staff can manage invoice senders" ON invoice_senders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()
      AND "User".role IN ('admin', 'employee')
    )
  );

-- Seed Initial Adveris Advisors LLP profile
INSERT INTO invoice_senders (name, address_line_1, address_line_2, city, state_province, zip_postal_code, country, logo_key)
SELECT 
  'Adveris Advisors LLP',
  'Level 14 & 15, Concorde Towers',
  'UB City, 1 Vittal Mallya Road',
  'Bengaluru',
  'Karnataka',
  '560001',
  'India',
  '/favicon.svg' -- Default logo using existing favicon in repo
WHERE NOT EXISTS (
  SELECT 1 FROM invoice_senders 
  WHERE name = 'Adveris Advisors LLP'
);

-- Update invoices table to link and snapshot sender details
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES invoice_senders(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sender_details JSONB;
