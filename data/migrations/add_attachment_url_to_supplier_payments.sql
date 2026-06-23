-- data/migrations/add_attachment_url_to_supplier_payments.sql

ALTER TABLE public.supplier_payments ADD COLUMN IF NOT EXISTS attachment_url text;
