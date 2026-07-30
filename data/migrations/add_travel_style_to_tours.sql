-- Migration: Add travel_style column to public.tours table and backfill values

ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS travel_style TEXT DEFAULT 'Luxury';

-- Backfill from planner_data JSON
UPDATE public.tours
SET travel_style = COALESCE(
    planner_data->'profile'->>'travelStyle',
    planner_data->'profile'->>'travel_style',
    'Luxury'
)
WHERE travel_style IS NULL;

-- Backfill from tourist_profiles table if available
UPDATE public.tours t
SET travel_style = tp.travel_style
FROM public.tourist_profiles tp
WHERE tp.id = t.tourist_id AND tp.travel_style IS NOT NULL;
