-- Stores the uploaded bank slip / verification document for a payment_details record.
ALTER TABLE public.payment_details
  ADD COLUMN IF NOT EXISTS proof_url text;
