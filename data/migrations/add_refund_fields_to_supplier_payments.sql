-- data/migrations/add_refund_fields_to_supplier_payments.sql
-- Proper refund tracking on supplier_payments.
-- A refund stays a row in supplier_payments with a NEGATIVE amount (so existing paid-total sums keep working),
-- but is now explicitly flagged and carries its own reason, description and link to the original payment.
-- The slip/receipt uses the existing attachment_url column; the supplier's refund / credit-note reference
-- uses the existing payment_reference column.

ALTER TABLE public.supplier_payments
    ADD COLUMN IF NOT EXISTS is_refund boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS refund_reason text,
    ADD COLUMN IF NOT EXISTS refund_description text,
    ADD COLUMN IF NOT EXISTS original_payment_id uuid REFERENCES public.supplier_payments(id) ON DELETE SET NULL;

-- Backfill existing refunds (negative amounts recorded before these columns existed)
UPDATE public.supplier_payments
SET is_refund = true,
    refund_reason = COALESCE(substring(payment_reference from '^REFUND \((.*?)\)'), refund_reason),
    refund_description = NULLIF(trim(regexp_replace(COALESCE(notes, ''), '^Reason: [^.]*\.?\s*', '')), ''),
    payment_reference = NULLIF(trim(regexp_replace(COALESCE(payment_reference, ''), '^REFUND \([^)]*\):?\s*', '')), '')
WHERE amount < 0 AND is_refund = false;

-- A refund must always be a negative amount
ALTER TABLE public.supplier_payments DROP CONSTRAINT IF EXISTS supplier_payments_refund_amount_chk;
ALTER TABLE public.supplier_payments
    ADD CONSTRAINT supplier_payments_refund_amount_chk CHECK (NOT is_refund OR amount < 0);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_is_refund ON public.supplier_payments(is_refund);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_original_payment_id ON public.supplier_payments(original_payment_id);
