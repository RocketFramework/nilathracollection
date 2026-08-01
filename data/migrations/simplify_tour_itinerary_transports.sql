-- Migration: Simplify tour_itinerary_transports table and recreate RLS policies
-- Drops unique constraint on tour_itinerary_id to allow multiple allocations per day

ALTER TABLE public.tour_itinerary_transports DROP CONSTRAINT IF EXISTS uq_tit_tour_itinerary;
ALTER TABLE public.tour_itinerary_transports DROP CONSTRAINT IF EXISTS tour_itinerary_transports_tour_itinerary_id_key;

ALTER TABLE public.tour_itinerary_transports
    DROP COLUMN IF EXISTS contracted_per_day_rate,
    DROP COLUMN IF EXISTS contracted_excess_mileage_cost,
    DROP COLUMN IF EXISTS contracted_other_allowance,
    DROP COLUMN IF EXISTS charged_per_day_rate,
    DROP COLUMN IF EXISTS charged_excess_mileage_cost,
    DROP COLUMN IF EXISTS charged_other_allowance,
    DROP COLUMN IF EXISTS route_path,
    DROP COLUMN IF EXISTS distance_km,
    DROP COLUMN IF EXISTS notes;

-- Re-enable RLS and ensure the policy is correctly applied
ALTER TABLE public.tour_itinerary_transports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_agent_finance_all_tit ON public.tour_itinerary_transports;
CREATE POLICY admin_agent_finance_all_tit
    ON public.tour_itinerary_transports
    FOR ALL
    TO authenticated, service_role
    USING (true)
    WITH CHECK (true);
