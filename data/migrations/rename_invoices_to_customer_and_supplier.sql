-- Migration: Rename invoices and payments to customer_* and supplier_* tables for clarity.

-- 1. Rename client-facing invoices tables
ALTER TABLE IF EXISTS public.invoices RENAME TO customer_invoices;
ALTER TABLE IF EXISTS public.invoice_items RENAME TO customer_invoice_items;
ALTER TABLE IF EXISTS public.payments RENAME TO customer_payments;

-- 2. Rename supplier-facing invoices tables
ALTER TABLE IF EXISTS public.vendor_invoices RENAME TO supplier_invoices;
ALTER TABLE IF EXISTS public.vendor_payments RENAME TO supplier_payments;

-- 3. Rename foreign key constraints on the renamed tables to avoid confusion
-- client_invoice_items constraints
ALTER TABLE public.customer_invoice_items 
RENAME CONSTRAINT invoice_items_invoice_id_fkey TO customer_invoice_items_invoice_id_fkey;

-- client_payments constraints
ALTER TABLE public.customer_payments 
RENAME CONSTRAINT payments_invoice_id_fkey TO customer_payments_invoice_id_fkey;

-- supplier_payments constraints
ALTER TABLE IF EXISTS public.supplier_payments RENAME COLUMN vendor_invoice_id TO supplier_invoice_id;
ALTER TABLE public.supplier_payments 
RENAME CONSTRAINT vendor_payments_vendor_invoice_id_fkey TO supplier_payments_invoice_id_fkey;

-- 4. Recreate RLS Policies on customer tables (if they were already enabled)
ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

-- Recreate policies for customer_invoices
DROP POLICY IF EXISTS admin_financials ON public.customer_invoices;
CREATE POLICY admin_financials ON public.customer_invoices FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS tourist_read_invoices ON public.customer_invoices;
CREATE POLICY tourist_read_invoices ON public.customer_invoices FOR SELECT TO authenticated USING (tourist_id = auth.uid());

-- Recreate policies for customer_invoice_items
DROP POLICY IF EXISTS admin_invoice_items ON public.customer_invoice_items;
CREATE POLICY admin_invoice_items ON public.customer_invoice_items FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS tourist_read_invoice_items ON public.customer_invoice_items;
CREATE POLICY tourist_read_invoice_items ON public.customer_invoice_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.customer_invoices WHERE id = customer_invoice_items.invoice_id AND tourist_id = auth.uid())
);

-- Recreate policies for customer_payments
DROP POLICY IF EXISTS admin_payments ON public.customer_payments;
CREATE POLICY admin_payments ON public.customer_payments FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS tourist_read_payments ON public.customer_payments;
CREATE POLICY tourist_read_payments ON public.customer_payments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.customer_invoices WHERE id = customer_payments.invoice_id AND tourist_id = auth.uid())
);
