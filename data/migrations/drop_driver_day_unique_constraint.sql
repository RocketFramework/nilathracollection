-- Migration: Drop tour_itinerary_drivers unique constraint and support multiple drivers per day
ALTER TABLE public.tour_itinerary_drivers DROP CONSTRAINT IF EXISTS tour_itinerary_drivers_day_unique;
ALTER TABLE public.tour_itinerary_drivers DROP CONSTRAINT IF EXISTS tour_itinerary_drivers_tour_itinerary_id_key;

-- Ensure there is a unique constraint on (tour_itinerary_id, driver_id) to prevent duplicate assignments of the same driver on the same day
ALTER TABLE public.tour_itinerary_drivers DROP CONSTRAINT IF EXISTS tour_itinerary_drivers_itin_driver_unique;
ALTER TABLE public.tour_itinerary_drivers ADD CONSTRAINT tour_itinerary_drivers_itin_driver_unique UNIQUE (tour_itinerary_id, driver_id);
