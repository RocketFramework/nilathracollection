-- Migration: Company Expenses (Non-Tour, Non-Salary Overhead Expenses)
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.company_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    vendor_or_payee TEXT,
    voucher_number TEXT,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'LKR',
    exchange_rate NUMERIC(12, 4) NOT NULL DEFAULT 1,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
    payment_reference TEXT,
    bill_voucher_url TEXT,
    bank_transfer_slip_url TEXT,
    signed_voucher_url TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recorded_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_expenses_date ON public.company_expenses (expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_company_expenses_category ON public.company_expenses (category);

ALTER TABLE public.company_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_finance_all_company_expenses ON public.company_expenses;
DROP POLICY IF EXISTS admin_finance_select_company_expenses ON public.company_expenses;
DROP POLICY IF EXISTS admin_finance_insert_company_expenses ON public.company_expenses;
DROP POLICY IF EXISTS admin_only_update_company_expenses ON public.company_expenses;
DROP POLICY IF EXISTS admin_only_delete_company_expenses ON public.company_expenses;

-- Admin & Finance can view company expenses
CREATE POLICY admin_finance_select_company_expenses
    ON public.company_expenses
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

-- Admin & Finance can record (insert) new company expenses
CREATE POLICY admin_finance_insert_company_expenses
    ON public.company_expenses
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

-- Only Admin can edit existing company expenses
CREATE POLICY admin_only_update_company_expenses
    ON public.company_expenses
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

-- Only Admin can delete existing company expenses
CREATE POLICY admin_only_delete_company_expenses
    ON public.company_expenses
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

-- Seed default Company Expense categories into app_settings (editable in Admin -> Settings)
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES (
    'company_expense_categories',
    E'Admin\nStationery\nLaptop & Equipment Rent\nBuilding Rent\nMarketing Expense\nSales Expenses\nEntertainment\nRepair & Maintenance\nOfficial Travel\nMeeting Room Cost\nRefreshment\nOffice Welfare\nUtilities (Electricity / Water / Internet)\nSoftware & Subscriptions\nLegal, Accounting & Professional Fees\nBank Charges & Fees\nInsurance\nCourier & Postage\nCleaning & Security\nOther'
)
ON CONFLICT (setting_key) DO NOTHING;
