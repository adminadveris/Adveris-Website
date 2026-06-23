-- ============================================
-- PATCH: Create payment_methods table and update invoices
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name_branch TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  pan TEXT,
  swift_code TEXT,
  routing_number TEXT,
  bank_address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can view active payment methods
CREATE POLICY "Authenticated users can view payment methods" ON payment_methods
  FOR SELECT USING (true);

-- Policy 2: Staff (admin/employee) can manage all payment methods
CREATE POLICY "Staff can manage payment methods" ON payment_methods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()
      AND "User".role IN ('admin', 'employee')
    )
  );

-- Seed Initial Adveris Bank Details
INSERT INTO payment_methods (name, account_number, bank_name_branch, ifsc_code, pan)
SELECT 
  'Adveris Bank Details',
  '362011200047393',
  'AXIS Bank, Shimoga Branch',
  'UTIB0000232',
  'AWEPA2330F'
WHERE NOT EXISTS (
  SELECT 1 FROM payment_methods 
  WHERE name = 'Adveris Bank Details' 
  AND account_number = '362011200047393'
);

-- Update invoices table to link and snapshot payment details
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_details JSONB;
