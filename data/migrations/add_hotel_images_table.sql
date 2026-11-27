-- Migration: Create shared hotel_images table supporting up to 3 WebP/AVIF images per hotel
-- Used by both Master Data (Edit Hotel) and Proposed Hotels step.
-- Run this in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.hotel_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 1 CHECK (sort_order BETWEEN 1 AND 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_images_hotel_id ON public.hotel_images(hotel_id, sort_order);

-- Backfill existing master primary hotel photos from public.hotels.photo_url
INSERT INTO public.hotel_images (hotel_id, image_url, is_primary, sort_order)
SELECT id, photo_url, TRUE, 1
FROM public.hotels
WHERE photo_url IS NOT NULL
  AND trim(photo_url) <> ''
  AND NOT EXISTS (
      SELECT 1 FROM public.hotel_images hi WHERE hi.hotel_id = public.hotels.id
  );

COMMENT ON TABLE public.hotel_images IS 'Up to 3 optimized WebP/AVIF images per hotel, shared between Master Data and Proposed Hotels. Primary image is synced to hotels.photo_url.';
