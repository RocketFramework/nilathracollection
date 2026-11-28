-- Migration: Company Payment Receive (Incoming Payments Ledger)
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.company_payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    received_from TEXT,
    receipt_number TEXT,
    tour_code TEXT,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'LKR',
    exchange_rate NUMERIC(12, 4) NOT NULL DEFAULT 1,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
    payment_reference TEXT,
    bank_account TEXT,
    bank_slip_url TEXT,
    receipt_voucher_url TEXT,
    signed_document_url TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recorded_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_payment_receipts_date ON public.company_payment_receipts (received_date DESC);
CREATE INDEX IF NOT EXISTS idx_company_payment_receipts_category ON public.company_payment_receipts (category);

ALTER TABLE public.company_payment_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_finance_select_company_payment_receipts ON public.company_payment_receipts;
DROP POLICY IF EXISTS admin_finance_insert_company_payment_receipts ON public.company_payment_receipts;
DROP POLICY IF EXISTS admin_only_update_company_payment_receipts ON public.company_payment_receipts;
DROP POLICY IF EXISTS admin_only_delete_company_payment_receipts ON public.company_payment_receipts;

-- Admin & Finance can view received payments
CREATE POLICY admin_finance_select_company_payment_receipts
    ON public.company_payment_receipts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND r.name IN ('admin', 'finance')
        )
    );

-- Admin & Finance can record (insert) new received payments
CREATE POLICY admin_finance_insert_company_payment_receipts
    ON public.company_payment_receipts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND r.name IN ('admin', 'finance')
        )
    );

-- Only Admin can edit existing received payment records
CREATE POLICY admin_only_update_company_payment_receipts
    ON public.company_payment_receipts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND r.name = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND r.name = 'admin'
        )
    );

-- Only Admin can delete existing received payment records
CREATE POLICY admin_only_delete_company_payment_receipts
    ON public.company_payment_receipts
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND r.name = 'admin'
        )
    );

-- Seed default Payment Receive categories into app_settings (editable in Admin -> Settings)
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES (
    'company_payment_receive_categories',
    E'Tour Customer Payment\nAdvance / Deposit\nBalance Settlement\nPartner / Agent Commission Received\nSupplier Refund / Rebate\nCapital / Shareholder Injection\nBank Interest / FX Gain\nMiscellaneous Income\nOther'
)
ON CONFLICT (setting_key) DO NOTHING;
