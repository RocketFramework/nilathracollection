-- =====================================================================
-- Nilathra Collection: Office HR & Employee Management Schema
-- Includes all staff roles EXCEPT Finance and Tourists
-- Covers: General HR Profile, Leave Quotas & Approvals (Annual, Casual, Sick),
--         Salary & Allowances, Bank Details, and Commission Settings
-- =====================================================================

-- 1. Employees Master Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    employee_code TEXT UNIQUE,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'agent',
    supervisor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- General Office HR Details
    department TEXT NOT NULL DEFAULT 'Operations & Concierge',
    designation TEXT NOT NULL DEFAULT 'Travel Consultant',
    employment_type TEXT NOT NULL DEFAULT 'Full-Time'
        CHECK (employment_type IN ('Full-Time', 'Part-Time', 'Probation', 'Contract')),
    employment_status TEXT NOT NULL DEFAULT 'Active'
        CHECK (employment_status IN ('Active', 'Probation', 'On Leave', 'Suspended', 'Resigned')),
    join_date DATE,
    nic_or_passport TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    hr_notes TEXT,

    -- Salary & Payroll Details
    salary_currency TEXT NOT NULL DEFAULT 'LKR',
    basic_salary_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    fixed_allowances_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    epf_eligible BOOLEAN NOT NULL DEFAULT true,
    epf_number TEXT,
    bank_name TEXT,
    bank_branch TEXT,
    bank_account_number TEXT,
    bank_account_holder TEXT,

    -- Commission Policy & Targets
    commission_eligible BOOLEAN NOT NULL DEFAULT true,
    default_rating_tier TEXT NOT NULL DEFAULT 'meets'
        CHECK (default_rating_tier IN ('below', 'meets', 'exceeds', 'exceptional')),
    custom_commission_cap_usd NUMERIC(14,2),
    annual_gp_target_usd NUMERIC(14,2),
    commission_notes TEXT,

    -- Annual Leave Quotas & Opening Balances (Sri Lanka Office Defaults: 14 Annual, 7 Casual, 7 Sick)
    annual_leave_quota NUMERIC(5,1) NOT NULL DEFAULT 14.0,
    casual_leave_quota NUMERIC(5,1) NOT NULL DEFAULT 7.0,
    sick_leave_quota NUMERIC(5,1) NOT NULL DEFAULT 7.0,
    annual_leave_carried_forward NUMERIC(5,1) NOT NULL DEFAULT 0.0,
    annual_leave_opening_used NUMERIC(5,1) NOT NULL DEFAULT 0.0,
    casual_leave_opening_used NUMERIC(5,1) NOT NULL DEFAULT 0.0,
    sick_leave_opening_used NUMERIC(5,1) NOT NULL DEFAULT 0.0,

    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_supervisor_id ON public.employees(supervisor_id);

-- 2. Employee Leave Requests Table (Annual, Casual, Sick)
CREATE TABLE IF NOT EXISTS public.employee_leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('Annual', 'Casual', 'Sick')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count NUMERIC(5,1) NOT NULL CHECK (days_count > 0),
    is_half_day BOOLEAN NOT NULL DEFAULT false,
    half_day_period TEXT CHECK (half_day_period IS NULL OR half_day_period IN ('Morning', 'Afternoon')),
    reason TEXT NOT NULL,
    handover_notes TEXT,
    covering_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    covering_user_name TEXT,
    status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_by_name TEXT,
    reviewed_by_role TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_user_id ON public.employee_leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_status ON public.employee_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_dates ON public.employee_leave_requests(start_date, end_date);

-- 3. Seed existing non-Finance, non-Tourist users into public.employees
-- 3a. Admins
INSERT INTO public.employees (
    user_id, first_name, last_name, email, phone, role,
    department, designation, join_date, commission_eligible, is_active
)
SELECT
    ap.id,
    COALESCE(ap.first_name, ''),
    COALESCE(ap.last_name, ''),
    COALESCE(u.email, ''),
    ap.phone,
    'admin',
    'Management & Administration',
    'Administrator',
    ap.created_at::date,
    false,
    COALESCE(ap.is_active, true)
FROM public.admin_profiles ap
JOIN public.users u ON u.id = ap.id
WHERE NOT EXISTS (
    SELECT 1 FROM public.finance_profiles fp
    WHERE fp.id = ap.id
      AND NOT EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON r.id = ur.role_id
          WHERE ur.user_id = ap.id
            AND r.name IN ('admin', 'principal_supervisor', 'executive_supervisor', 'senior_supervisor', 'agent_supervisor', 'executive_agent', 'senior_agent', 'agent')
      )
)
ON CONFLICT (user_id) DO NOTHING;

-- 3b. Supervisors (Supervisor -> Principal Supervisor, including dual-role Finance + Supervisor)
INSERT INTO public.employees (
    user_id, first_name, last_name, email, phone, role, supervisor_id,
    department, designation, join_date, commission_eligible, is_active
)
SELECT
    sp.id,
    COALESCE(sp.first_name, ''),
    COALESCE(sp.last_name, ''),
    COALESCE(u.email, ''),
    sp.phone,
    COALESCE(
        (
            SELECT r.name
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = sp.id
              AND r.name IN ('agent_supervisor', 'senior_supervisor', 'executive_supervisor', 'principal_supervisor')
            LIMIT 1
        ),
        'agent_supervisor'
    ),
    sp.supervisor_id,
    'Operations & Concierge',
    'Operations Supervisor',
    sp.created_at::date,
    true,
    COALESCE(sp.is_active, true)
FROM public.agent_supervisor_profiles sp
JOIN public.users u ON u.id = sp.id
WHERE NOT EXISTS (
    SELECT 1 FROM public.finance_profiles fp
    WHERE fp.id = sp.id
      AND NOT EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON r.id = ur.role_id
          WHERE ur.user_id = sp.id
            AND r.name IN ('principal_supervisor', 'executive_supervisor', 'senior_supervisor', 'agent_supervisor')
      )
)
ON CONFLICT (user_id) DO NOTHING;

-- 3c. Agents (Agent, Senior Agent, Executive Agent, including dual-role Finance + Senior Agent)
INSERT INTO public.employees (
    user_id, first_name, last_name, email, phone, role, supervisor_id,
    department, designation, join_date, commission_eligible, is_active
)
SELECT
    ag.id,
    COALESCE(ag.first_name, ''),
    COALESCE(ag.last_name, ''),
    COALESCE(u.email, ''),
    ag.phone,
    COALESCE(
        (
            SELECT r.name
            FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = ag.id
              AND r.name IN ('agent', 'senior_agent', 'executive_agent')
            LIMIT 1
        ),
        'agent'
    ),
    ag.supervisor_id,
    'Sales & Tour Planning',
    'Travel Concierge Agent',
    ag.created_at::date,
    true,
    COALESCE(ag.is_active, true)
FROM public.agent_profiles ag
JOIN public.users u ON u.id = ag.id
WHERE NOT EXISTS (
    SELECT 1 FROM public.finance_profiles fp
    WHERE fp.id = ag.id
      AND NOT EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON r.id = ur.role_id
          WHERE ur.user_id = ag.id
            AND r.name IN ('executive_agent', 'senior_agent', 'agent')
      )
)
ON CONFLICT (user_id) DO NOTHING;

-- Assign sequential employee codes (EMP-001, EMP-002, ...) where missing
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY join_date NULLS LAST, created_at ASC) AS rn
    FROM public.employees
    WHERE employee_code IS NULL
)
UPDATE public.employees e
SET employee_code = 'EMP-' || LPAD(numbered.rn::text, 3, '0')
FROM numbered
WHERE e.id = numbered.id;

-- 4. Multi-role aware get_user_role helper (prioritizes 'admin' > operational hierarchy > 'finance' > 'tourist')
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    user_role VARCHAR(50);
    meta_role VARCHAR(50);
BEGIN
    SELECT r.name INTO user_role
    FROM public.roles r
    JOIN public.user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = $1
    ORDER BY CASE r.name
        WHEN 'admin' THEN 100
        WHEN 'principal_supervisor' THEN 70
        WHEN 'executive_supervisor' THEN 60
        WHEN 'senior_supervisor' THEN 50
        WHEN 'agent_supervisor' THEN 40
        WHEN 'executive_agent' THEN 30
        WHEN 'senior_agent' THEN 20
        WHEN 'agent' THEN 10
        WHEN 'finance' THEN 5
        WHEN 'tourist' THEN 1
        ELSE 0
    END DESC
    LIMIT 1;

    IF user_role IS NOT NULL THEN
        RETURN user_role;
    END IF;

    IF EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = $1) THEN
        RETURN 'admin';
    END IF;

    IF EXISTS (SELECT 1 FROM public.finance_profiles WHERE id = $1) THEN
        RETURN 'finance';
    END IF;

    IF EXISTS (SELECT 1 FROM public.agent_supervisor_profiles WHERE id = $1) THEN
        RETURN 'agent_supervisor';
    END IF;

    IF EXISTS (SELECT 1 FROM public.agent_profiles WHERE id = $1) THEN
        RETURN 'agent';
    END IF;

    IF EXISTS (SELECT 1 FROM public.tourist_profiles WHERE id = $1) THEN
        RETURN 'tourist';
    END IF;

    SELECT (raw_user_meta_data->>'role')::VARCHAR(50) INTO meta_role
    FROM auth.users
    WHERE id = $1;

    IF meta_role IS NOT NULL THEN
        RETURN meta_role;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Employee Salary Payments & Uploaded Slip Ledger
CREATE TABLE IF NOT EXISTS public.employee_salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    salary_month TEXT NOT NULL, -- Format: 'YYYY-MM'
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    currency TEXT NOT NULL DEFAULT 'LKR',
    basic_salary_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    fixed_allowances_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    additions_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    epf_employee_deduction_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    other_deductions_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    gross_amount_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_paid_lkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'Bank Transfer'
        CHECK (payment_method IN ('Bank Transfer', 'Cash', 'Cheque')),
    payment_reference TEXT,
    bank_account_snapshot TEXT,
    slip_storage_path TEXT NOT NULL,
    slip_file_name TEXT,
    notes TEXT,
    email_sent BOOLEAN NOT NULL DEFAULT false,
    email_sent_to TEXT,
    email_sent_at TIMESTAMPTZ,
    email_error TEXT,
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


