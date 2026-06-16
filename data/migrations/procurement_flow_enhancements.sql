-- Link Purchase Orders directly to Quotation Requests
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS quotation_request_id UUID REFERENCES public.quotation_request(id) ON DELETE SET NULL;

-- Enhance Supplier Invoices to support Tallying & Approvals
ALTER TABLE public.supplier_invoices 
ADD COLUMN IF NOT EXISTS is_tallied BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS discrepancy_amount NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add Index for Quote-to-PO lookups
CREATE INDEX IF NOT EXISTS idx_po_quotation_request ON public.purchase_orders(quotation_request_id);
