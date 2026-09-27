-- PostgreSQL Migration to Add ai_rules to draft_itinerary_versions
ALTER TABLE public.draft_itinerary_versions 
ADD COLUMN IF NOT EXISTS ai_rules JSONB DEFAULT NULL;
