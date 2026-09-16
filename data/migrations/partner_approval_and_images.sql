-- Migration: Add partner approval tracking and vehicle/SLTDA guide image fields

-- 1. Add fields to tour_guides
ALTER TABLE public.tour_guides ADD COLUMN IF NOT EXISTS sltda_id_image_url TEXT;
ALTER TABLE public.tour_guides ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE public.tour_guides ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tour_guides ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 2. Add fields to transport_providers
ALTER TABLE public.transport_providers ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE public.transport_providers ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.transport_providers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. Add fields to transport_vehicles
ALTER TABLE public.transport_vehicles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.transport_vehicles ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE public.transport_vehicles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.transport_vehicles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 4. Add fields to drivers
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS license_image_url TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 5. Create storage bucket for partner documents (SLTDA ID card images, vehicle images)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-documents', 'partner-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
CREATE POLICY "Public read partner documents" 
ON storage.objects FOR SELECT TO public USING (bucket_id = 'partner-documents');

CREATE POLICY "Authenticated upload partner documents" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'partner-documents');

CREATE POLICY "Anon upload partner documents" 
ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'partner-documents');
