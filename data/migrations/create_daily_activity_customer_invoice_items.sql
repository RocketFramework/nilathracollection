-- Migration: Create daily_activity_customer_invoice_items to link customer_invoice_items to daily_activities (many-to-many relationship)

CREATE TABLE IF NOT EXISTS public.daily_activity_customer_invoice_items (
    invoice_item_id UUID REFERENCES public.customer_invoice_items(id) ON DELETE CASCADE NOT NULL,
    daily_activity_id UUID REFERENCES public.daily_activities(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (invoice_item_id, daily_activity_id)
);

-- Index for performance on joins
CREATE INDEX IF NOT EXISTS idx_da_cii_invoice_item ON public.daily_activity_customer_invoice_items(invoice_item_id);
CREATE INDEX IF NOT EXISTS idx_da_cii_daily_activity ON public.daily_activity_customer_invoice_items(daily_activity_id);

-- Enable RLS
ALTER TABLE public.daily_activity_customer_invoice_items ENABLE ROW LEVEL SECURITY;

-- Recreate policies for daily_activity_customer_invoice_items
DROP POLICY IF EXISTS admin_daily_activity_invoice_items ON public.daily_activity_customer_invoice_items;
CREATE POLICY admin_daily_activity_invoice_items ON public.daily_activity_customer_invoice_items FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS tourist_read_daily_activity_invoice_items ON public.daily_activity_customer_invoice_items;
CREATE POLICY tourist_read_daily_activity_invoice_items ON public.daily_activity_customer_invoice_items FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.customer_invoice_items cii
        JOIN public.customer_invoices ci ON ci.id = cii.invoice_id
        WHERE cii.id = daily_activity_customer_invoice_items.invoice_item_id
        AND ci.tourist_id = auth.uid()
    )
);
