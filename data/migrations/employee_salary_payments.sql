-- =====================================================================
-- Nilathra Collection: Employee Salary Payments & Slip Records
-- Allows Admin and Finance roles to record monthly employee salary payments,
-- store uploaded bank/payment slips (Supabase 'payslips' bucket), and track
-- automated email notifications sent to employees.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.employee_salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    salary_month TEXT NOT NULL, -- Format: 'YYYY-MM' (e.g. '2026-11')
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    currency TEXT NOT NULL DEFAULT 'LKR',

    -- Remuneration Breakdown (LKR)
    basic_salary_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    fixed_allowances_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    additions_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    epf_employee_deduction_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    other_deductions_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    gross_amount_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_paid_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,

    -- Payment Execution & Slip Attachment
    payment_method TEXT NOT NULL DEFAULT 'Bank Transfer'
        CHECK (payment_method IN ('Bank Transfer', 'Cash', 'Cheque')),
    payment_reference TEXT,
    bank_account_snapshot TEXT,
    slip_storage_path TEXT NOT NULL,
    slip_file_name TEXT,
    notes TEXT,

    -- Automated Email Delivery Audit
    email_sent BOOLEAN NOT NULL DEFAULT false,
    email_sent_to TEXT,
    email_sent_at TIMESTAMPTZ,
    email_error TEXT,

    -- Recorded By (Admin or Finance)
    paid_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    paid_by_name TEXT,
    paid_by_role TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_salary_payments_user_id
    ON public.employee_salary_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_salary_payments_employee_id
    ON public.employee_salary_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_salary_payments_month
    ON public.employee_salary_payments(salary_month DESC, payment_date DESC);

ALTER TABLE public.employee_salary_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_salary_payments_select_self_or_payroll" ON public.employee_salary_payments;
CREATE POLICY "employee_salary_payments_select_self_or_payroll"
    ON public.employee_salary_payments
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND r.name IN ('admin', 'finance')
        )
        OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.finance_profiles WHERE id = auth.uid())
    );

