-- ============================================
-- PATCH: Add new columns to existing invoices table
-- Run this if you already ran the previous migration
-- ============================================

-- Add new columns
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gst_type TEXT DEFAULT 'gst';
