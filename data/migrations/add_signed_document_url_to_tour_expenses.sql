-- Add signed_document_url column to tour_expenses for storing the Signed Voucher / Direct Bill
-- alongside receipt_url (payment slip / receipt).
ALTER TABLE public.tour_expenses
  ADD COLUMN IF NOT EXISTS signed_document_url text;

