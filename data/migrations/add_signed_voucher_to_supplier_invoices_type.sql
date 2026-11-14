-- data/migrations/add_signed_voucher_to_supplier_invoices_type.sql
-- Allows 'Signed Voucher' alongside 'Pro Forma' and 'Final' on supplier_invoices.invoice_type
-- so self-billed signed settlement vouchers can serve as the Bill / Voucher of Record for AP & 3-way matching
-- while remaining clearly distinguished from supplier-issued tax invoices.
ALTER TABLE public.supplier_invoices
  DROP CONSTRAINT IF EXISTS supplier_invoices_invoice_type_check;

ALTER TABLE public.supplier_invoices
  ADD CONSTRAINT supplier_invoices_invoice_type_check
  CHECK (invoice_type IN ('Pro Forma', 'Final', 'Signed Voucher'));

