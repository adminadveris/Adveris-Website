-- ============================================
-- ALTER: Add invoice_type column to invoices table
-- ============================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'Tax Invoice';
