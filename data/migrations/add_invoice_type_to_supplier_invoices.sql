-- data/migrations/add_invoice_type_to_supplier_invoices.sql
-- Distinguishes pro forma invoices from final invoices uploaded in Finance Controlling.
ALTER TABLE public.supplier_invoices
  ADD COLUMN IF NOT EXISTS invoice_type text NOT NULL DEFAULT 'Final';

ALTER TABLE public.supplier_invoices
  DROP CONSTRAINT IF EXISTS supplier_invoices_invoice_type_check;

ALTER TABLE public.supplier_invoices
  ADD CONSTRAINT supplier_invoices_invoice_type_check
  CHECK (invoice_type IN ('Pro Forma', 'Final'));
