-- data/migrations/advanced_finance_controlling.sql

-- 1. Alter supplier_invoices to add currency and exchange rate fields
ALTER TABLE public.supplier_invoices 
  ADD COLUMN IF NOT EXISTS currency character varying(10) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(12, 4) DEFAULT 1.0000;

-- 2. Alter supplier_payments to allow advance payments against POs without invoices
ALTER TABLE public.supplier_payments 
  ALTER COLUMN supplier_invoice_id DROP NOT NULL;

ALTER TABLE public.supplier_payments 
  ADD COLUMN IF NOT EXISTS purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS currency character varying(10) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(12, 4) DEFAULT 1.0000;

-- 3. Create supplier_invoice_items table for line-item matching
CREATE TABLE IF NOT EXISTS public.supplier_invoice_items (
  id uuid NOT null DEFAULT extensions.uuid_generate_v4 (),
  supplier_invoice_id uuid NOT null,
  purchase_order_item_id uuid null,
  description text NOT null,
  quantity numeric(10, 2) null DEFAULT 1,
  unit_price numeric(12, 2) null DEFAULT 0,
  total_price numeric(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamp with time zone null DEFAULT now(),
  CONSTRAINT supplier_invoice_items_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_invoice_items_invoice_id_fkey FOREIGN KEY (supplier_invoice_id) REFERENCES public.supplier_invoices (id) ON DELETE CASCADE,
  CONSTRAINT supplier_invoice_items_po_item_id_fkey FOREIGN KEY (purchase_order_item_id) REFERENCES public.purchase_order_items (id) ON DELETE SET null
) TABLESPACE pg_default;

-- Add index on supplier_invoice_id for faster queries
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv_id ON public.supplier_invoice_items USING btree (supplier_invoice_id) TABLESPACE pg_default;
