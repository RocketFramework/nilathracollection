-- Migration: Simplify tour_itinerary_transports table to act as a join table
-- Retains: id, tour_id, tour_itinerary_id, transport_provider_id, vehicle_id, created_at, updated_at

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
