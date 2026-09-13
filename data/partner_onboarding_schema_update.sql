-- Migration for Partner Onboarding Portals

-- 1. Ensure transport_providers has necessary onboarding columns
ALTER TABLE public.transport_providers 
ADD COLUMN IF NOT EXISTS nic_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_ip TEXT,
ADD COLUMN IF NOT EXISTS onboarding_code TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Onboarding',
ADD COLUMN IF NOT EXISTS sltda_registered_driver BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Ensure tour_guides has necessary onboarding columns
ALTER TABLE public.tour_guides 
ADD COLUMN IF NOT EXISTS nic_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_ip TEXT,
ADD COLUMN IF NOT EXISTS onboarding_code TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Onboarding',
ADD COLUMN IF NOT EXISTS sltda_registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS german_proficiency BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS french_proficiency BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- 3. Seed default onboarding codes into app_settings if not present
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES 
  ('transport_partner_onboarding_code', 'NILATHRA-TRANS-2026'),
  ('tour_guide_onboarding_code', 'NILATHRA-GUIDE-2026')
ON CONFLICT (setting_key) DO NOTHING;
