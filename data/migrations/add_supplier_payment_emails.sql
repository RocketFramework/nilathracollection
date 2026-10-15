-- Tracks payment confirmation emails sent to the supplier team (advance or against an invoice).
CREATE TABLE IF NOT EXISTS public.supplier_payment_emails (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id uuid,
    purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    supplier_invoice_id uuid REFERENCES public.supplier_invoices(id) ON DELETE SET NULL,
    supplier_payment_id uuid REFERENCES public.supplier_payments(id) ON DELETE CASCADE,
    recipient_email text NOT NULL,
    sender_email text,
    subject text,
    body_html text,
    attachment_path text,
    status text NOT NULL DEFAULT 'Sent',
    error_message text,
    sent_by uuid,
    sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_payment_emails_payment ON public.supplier_payment_emails(supplier_payment_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_emails_po ON public.supplier_payment_emails(purchase_order_id);
