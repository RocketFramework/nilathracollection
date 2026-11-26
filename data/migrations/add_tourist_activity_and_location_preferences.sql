-- Migration: Add tourist activity category preferences and ordered travel route locations
-- Run this in Supabase SQL Editor

ALTER TABLE public.tourist_profiles
    ADD COLUMN IF NOT EXISTS activity_preferences TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS travel_locations TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.tourist_profiles.activity_preferences IS 'Selected activity categories preferred by the tourist (e.g., Adventure, Beach, Cultural & Heritage, Wildlife).';
COMMENT ON COLUMN public.tourist_profiles.travel_locations IS 'Ordered list of Sri Lankan districts / tour destinations representing the tourist travel route (duplicates allowed).';
