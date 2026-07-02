-- Migration: Add advance payment options, currency, exchange rate, and slip upload to customer_payments table
ALTER TABLE public.customer_payments ALTER COLUMN invoice_id DROP NOT NULL;

ALTER TABLE public.customer_payments 
  ADD COLUMN IF NOT EXISTS tour_id uuid REFERENCES public.tours(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS currency character varying(10) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(12, 4) DEFAULT 1.0000,
  ADD COLUMN IF NOT EXISTS payment_date date,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS is_advance boolean DEFAULT FALSE;

-- Ensure payment_date is initialized to created_at cast to date for existing rows (if any)
UPDATE public.customer_payments SET payment_date = COALESCE(payment_date, created_at::date);
