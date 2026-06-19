-- PostgreSQL Migration to Add day_cost_overrides to draft_itinerary_versions
ALTER TABLE public.draft_itinerary_versions 
ADD COLUMN IF NOT EXISTS day_cost_overrides JSONB;
