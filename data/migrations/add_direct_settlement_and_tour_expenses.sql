-- Direct (no-invoice) settlement of purchase orders: drivers / activity providers / custom POs
-- agreed verbally and paid by cash or transfer against a signed document.
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS settlement_mode text NOT NULL DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS settlement_notes text,
  ADD COLUMN IF NOT EXISTS signed_document_url text,
  ADD COLUMN IF NOT EXISTS settled_by_name text,
  ADD COLUMN IF NOT EXISTS settled_date date;

-- Miscellaneous tour expenses that have no purchase order (fuel, parking, tips, stationery, gifts, ...).
CREATE TABLE IF NOT EXISTS public.tour_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  paid_to text,
  amount numeric(12, 2) NOT NULL,
  currency character varying(10) NOT NULL DEFAULT 'LKR',
  exchange_rate numeric(12, 4) NOT NULL DEFAULT 1.0000,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  payment_reference text,
  receipt_url text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tour_expenses_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_tour_expenses_tour_id ON public.tour_expenses USING btree (tour_id);
