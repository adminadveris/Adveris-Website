-- ============================================
-- Adveris Portal — Database Migration
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- =============================================
-- TABLE 1: request_messages (Chatter Feature)
-- =============================================
CREATE TABLE IF NOT EXISTS request_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES "Request"(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES "User"(id),
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE request_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view messages" ON request_messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert messages" ON request_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE request_messages;


-- =============================================
-- TABLE 2: invoices (Invoice Generation)
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  account_id UUID REFERENCES accounts(id),
  account_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_designation TEXT,
  billing_address TEXT,
  gstin TEXT,
  gst_type TEXT DEFAULT 'gst' CHECK (gst_type IN ('gst', 'non_gst')),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_terms TEXT DEFAULT 'Net 30',
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 18,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  line_items JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  created_by_id UUID REFERENCES "User"(id),
  created_by_name TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Staff can do everything
CREATE POLICY "Staff can view invoices" ON invoices
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert invoices" ON invoices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update invoices" ON invoices
  FOR UPDATE USING (true);

-- Clients can view their own account's invoices
-- (The SELECT policy above already allows all, but for stricter control:)
-- CREATE POLICY "Clients view own account invoices" ON invoices
--   FOR SELECT USING (
--     account_id IN (
--       SELECT account_id FROM "User" WHERE id = auth.uid()
--     )
--   );
