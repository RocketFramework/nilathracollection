-- Ensure vendor_email column exists on purchase_orders
-- (may be missing from the live DB if the table was created before this field was added)
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS vendor_email VARCHAR(255);

-- Reload PostgREST schema cache so the new column is immediately visible
NOTIFY pgrst, 'reload schema';
