-- Migration: Create purchase_order_daily_transport_items
--
-- Purpose: Links one purchase_order_items billing row (per service day) to all
-- individual daily_activities travel legs on that day, plus the transport_requirement
-- that defines vehicle specs. Stores snapshot pricing from transport_vehicles so
-- historical POs are not affected by future rate changes.
--
-- Pricing columns:
--   day_rate              - base rate for the day (from transport_vehicles.day_rate)
--   max_km_per_day        - km threshold before extra charges apply
--   additional_km_rate    - rate per km over the threshold
--   total_km_for_day      - actual km driven (SUM of daily_activities.quantity for travel legs)
--   extra_km              - GENERATED: max(0, total_km_for_day - max_km_per_day)
--   extra_km_charge       - GENERATED: extra_km * additional_km_rate
--   day_total_price       - GENERATED: day_rate + extra_km_charge

CREATE TABLE IF NOT EXISTS public.purchase_order_daily_transport_items (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Billing parent (one row per day in purchase_order_items)
    purchase_order_item_id  UUID        NOT NULL
                                REFERENCES public.purchase_order_items(id)
                                ON DELETE CASCADE,

    -- Individual travel leg in the itinerary
    daily_activity_id       UUID
                                REFERENCES public.daily_activities(id)
                                ON DELETE SET NULL,

    -- Transport requirement (gives access to vehicle specs via transport_requirement_vehicles)
    transport_requirement_id UUID
                                REFERENCES public.transport_requirements(id)
                                ON DELETE SET NULL,

    -- Snapshot pricing from transport_vehicles at PO creation time
    day_rate                NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    max_km_per_day          INTEGER         NOT NULL DEFAULT 0,
    additional_km_rate      NUMERIC(10, 2)  NOT NULL DEFAULT 0,

    -- Actual km for the day (SUM of daily_activities.quantity for all travel legs that day)
    total_km_for_day        NUMERIC(10, 2)  NOT NULL DEFAULT 0,

    -- Computed columns (derived automatically by the DB)
    extra_km                NUMERIC(10, 2)
                                GENERATED ALWAYS AS (
                                    GREATEST(0, total_km_for_day - max_km_per_day)
                                ) STORED,

    extra_km_charge         NUMERIC(10, 2)
                                GENERATED ALWAYS AS (
                                    GREATEST(0, total_km_for_day - max_km_per_day) * additional_km_rate
                                ) STORED,

    day_total_price         NUMERIC(10, 2)
                                GENERATED ALWAYS AS (
                                    day_rate + GREATEST(0, total_km_for_day - max_km_per_day) * additional_km_rate
                                ) STORED,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_podti_po_item_id
    ON public.purchase_order_daily_transport_items (purchase_order_item_id);

CREATE INDEX IF NOT EXISTS idx_podti_daily_activity_id
    ON public.purchase_order_daily_transport_items (daily_activity_id);

CREATE INDEX IF NOT EXISTS idx_podti_transport_requirement_id
    ON public.purchase_order_daily_transport_items (transport_requirement_id);

-- RLS
ALTER TABLE public.purchase_order_daily_transport_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_agent_finance_all_podti ON public.purchase_order_daily_transport_items;
CREATE POLICY admin_agent_finance_all_podti
    ON public.purchase_order_daily_transport_items
    FOR ALL TO authenticated
    USING (get_user_role(auth.uid()) IN ('admin', 'agent', 'finance'));
