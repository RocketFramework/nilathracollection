-- =====================================================================
-- Nilathra Collection: Employee Hierarchy & Tour Commission Management System
-- Phase 4 Production Schema Migration
-- =====================================================================

-- 1. Versioned Commission Rules Table
CREATE TABLE IF NOT EXISTS public.commission_rule_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number INTEGER NOT NULL UNIQUE,
    version_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    pool_percentage NUMERIC(6,2) NOT NULL DEFAULT 15.00,
    max_ceiling_pool_percentage NUMERIC(6,2) NOT NULL DEFAULT 20.00,
    multiplier_cap_mode TEXT NOT NULL DEFAULT 'HARD_CAP_RESERVE',
    direct_share_percentage NUMERIC(6,2) NOT NULL DEFAULT 70.00,
    leadership_share_percentage NUMERIC(6,2) NOT NULL DEFAULT 25.00,
    team_dev_share_percentage NUMERIC(6,2) NOT NULL DEFAULT 5.00,
    leadership_tier_weights JSONB NOT NULL DEFAULT '{"tier1": 50, "tier2": 30, "tier3": 20}'::jsonb,
    performance_multipliers JSONB NOT NULL DEFAULT '{"below": 0.5, "meets": 1.0, "exceeds": 1.2, "exceptional": 1.5}'::jsonb,
    enable_per_employee_cap BOOLEAN NOT NULL DEFAULT true,
    role_max_cap_usd JSONB NOT NULL DEFAULT '{"agent": 350, "senior_agent": 500, "executive_agent": 750, "agent_supervisor": 250, "senior_supervisor": 200, "executive_supervisor": 150, "principal_supervisor": 150}'::jsonb,
    progression_criteria JSONB NOT NULL DEFAULT '{
        "agent": {"nextRole": "senior_agent", "minTours": 8, "minGpUsd": 25000, "minMentees": 0},
        "senior_agent": {"nextRole": "executive_agent", "minTours": 20, "minGpUsd": 75000, "minMentees": 2},
        "executive_agent": {"nextRole": "agent_supervisor", "minTours": 35, "minGpUsd": 150000, "minMentees": 3},
        "agent_supervisor": {"nextRole": "senior_supervisor", "minTours": 50, "minGpUsd": 300000, "minMentees": 4},
        "senior_supervisor": {"nextRole": "executive_supervisor", "minTours": 75, "minGpUsd": 600000, "minMentees": 6},
        "executive_supervisor": {"nextRole": "principal_supervisor", "minTours": 100, "minGpUsd": 1000000, "minMentees": 8}
    }'::jsonb,
    notes TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Rule Version 1 if not present
INSERT INTO public.commission_rule_versions (
    version_number,
    version_name,
    is_active,
    pool_percentage,
    max_ceiling_pool_percentage,
    multiplier_cap_mode,
    direct_share_percentage,
    leadership_share_percentage,
    team_dev_share_percentage,
    enable_per_employee_cap,
    notes
)
VALUES (
    1,
    'v1.0 — Nilathra Standard Profit-Pool & Role Cap Policy',
    true,
    15.00,
    20.00,
    'HARD_CAP_RESERVE',
    70.00,
    25.00,
    5.00,
    true,
    'Initial versioned commission policy: 15% of Declared Gross Profit, 70% Direct / 25% Leadership / 5% Team Development, with per-role USD caps.'
)
ON CONFLICT (version_number) DO NOTHING;

-- 2. Master Tour Commissions Table (with Immutable Rule Snapshot & Declared Gross Profit)
CREATE TABLE IF NOT EXISTS public.tour_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL UNIQUE REFERENCES public.tours(id) ON DELETE CASCADE,
    rule_version_id UUID REFERENCES public.commission_rule_versions(id) ON DELETE SET NULL,
    rule_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'Not Eligible',
    customer_revenue_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    system_direct_expenses_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    declared_gross_profit_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    declared_gross_profit_notes TEXT,
    exchange_rate_lkr NUMERIC(12,2) NOT NULL DEFAULT 300,
    base_commission_pool_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    hard_cap_ceiling_pool_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    direct_sub_pool_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    leadership_sub_pool_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    team_dev_sub_pool_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_direct_distributed_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_leadership_distributed_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_team_dev_distributed_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_commission_distributed_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_commission_distributed_lkr NUMERIC(16,2) NOT NULL DEFAULT 0,
    total_capped_excess_returned_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    unallocated_pool_returned_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    company_retained_gross_profit_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    has_team_dev_eligible_mentor BOOLEAN NOT NULL DEFAULT false,
    team_dev_mentor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    team_dev_evidence TEXT,
    calculated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    paid_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_commissions_tour_id ON public.tour_commissions(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_commissions_status ON public.tour_commissions(status);

-- 3. Individual Tour Commission Allocations Table
CREATE TABLE IF NOT EXISTS public.tour_commission_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_commission_id UUID NOT NULL REFERENCES public.tour_commissions(id) ON DELETE CASCADE,
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    role_at_time TEXT NOT NULL,
    role_label TEXT NOT NULL,
    allocation_type TEXT NOT NULL,
    leadership_tier INTEGER,
    has_active_contribution BOOLEAN NOT NULL DEFAULT true,
    share_percentage NUMERIC(6,2) NOT NULL DEFAULT 0,
    rating_tier TEXT NOT NULL DEFAULT 'meets',
    applied_multiplier NUMERIC(6,2) NOT NULL DEFAULT 1.00,
    custom_max_cap_usd NUMERIC(14,2),
    applied_cap_usd NUMERIC(14,2),
    base_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    multiplier_adjusted_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    uncapped_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    capped_excess_returned_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    final_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    final_amount_lkr NUMERIC(16,2) NOT NULL DEFAULT 0,
    eligibility_status TEXT NOT NULL DEFAULT 'ELIGIBLE',
    eligibility_notes TEXT,
    is_override BOOLEAN NOT NULL DEFAULT false,
    override_justification TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_commission_allocations_commission_id ON public.tour_commission_allocations(tour_commission_id);
CREATE INDEX IF NOT EXISTS idx_tour_commission_allocations_user_id ON public.tour_commission_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_commission_allocations_tour_id ON public.tour_commission_allocations(tour_id);

-- 4. Commission Audit Logs & Documented Adjustments Table
CREATE TABLE IF NOT EXISTS public.commission_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_commission_id UUID NOT NULL REFERENCES public.tour_commissions(id) ON DELETE CASCADE,
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    adjustment_amount_usd NUMERIC(14,2) DEFAULT 0,
    justification TEXT NOT NULL,
    performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    performed_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_adjustments_commission_id ON public.commission_adjustments(tour_commission_id);
CREATE INDEX IF NOT EXISTS idx_commission_adjustments_tour_id ON public.commission_adjustments(tour_id);

