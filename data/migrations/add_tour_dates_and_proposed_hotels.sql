-- Migration: Add tour_route_stops (dated travel locations), tour_activity_selections (dated activities),
-- and tour_proposed_hotels (3 to 5 hotel options per tour date).
-- Run this in Supabase SQL Editor.

-- 1. Ordered travel route stops with specific tour dates (duplicates allowed across different dates)
CREATE TABLE IF NOT EXISTS public.tour_route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL DEFAULT 1,
    location_name TEXT NOT NULL,
    tour_date DATE,
    day_number INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tour_route_stops_tour_id ON public.tour_route_stops(tour_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_tour_route_stops_tour_date ON public.tour_route_stops(tour_id, tour_date);

-- 2. Selected activities from activity-selection step with assigned tour dates
CREATE TABLE IF NOT EXISTS public.tour_activity_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    activity_id INTEGER NOT NULL,
    tour_date DATE,
    day_number INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tour_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_tour_activity_selections_tour_id ON public.tour_activity_selections(tour_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tour_activity_selections_tour_date ON public.tour_activity_selections(tour_id, tour_date);

-- 3. Proposed hotels (3 to 5 hotel options per tour date)
CREATE TABLE IF NOT EXISTS public.tour_proposed_hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    tour_date DATE NOT NULL,
    day_number INTEGER,
    location_name TEXT,
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    option_rank INTEGER NOT NULL DEFAULT 1 CHECK (option_rank BETWEEN 1 AND 5),
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tour_id, tour_date, hotel_id)
);

CREATE INDEX IF NOT EXISTS idx_tour_proposed_hotels_tour_id ON public.tour_proposed_hotels(tour_id, tour_date, option_rank);

COMMENT ON TABLE public.tour_route_stops IS 'Ordered Sri Lanka travel locations with tour dates per tour.';
COMMENT ON TABLE public.tour_activity_selections IS 'Selected activities from the activity-selection step with assigned tour dates.';
COMMENT ON TABLE public.tour_proposed_hotels IS '3 to 5 proposed hotel options per tour date for the proposed-hotels step.';
