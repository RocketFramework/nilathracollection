-- Add client trip profile fields to tourist_profiles
ALTER TABLE public.tourist_profiles 
ADD COLUMN IF NOT EXISTS passport_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS adults INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS children INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS infants INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS arrival_date DATE,
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_per_person NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS travel_style VARCHAR(50) DEFAULT 'Luxury',
ADD COLUMN IF NOT EXISTS departure_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS dietary_requirements TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
ADD COLUMN IF NOT EXISTS accessibility_requirements TEXT,
ADD COLUMN IF NOT EXISTS language_preference VARCHAR(50) DEFAULT 'English',
ADD COLUMN IF NOT EXISTS special_notes TEXT;

-- Create tourist_team table for individual travelers
CREATE TABLE IF NOT EXISTS public.tourist_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    tourist_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    passport_number VARCHAR(100),
    nationality VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    dietary_preferences TEXT,
    meal_preference VARCHAR(50) DEFAULT 'Standard',
    room_preference VARCHAR(50) DEFAULT 'Double',
    shared_with_ids UUID[] DEFAULT '{}'::UUID[],
    medical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for tourist_team
ALTER TABLE public.tourist_team ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS admin_all_team ON public.tourist_team;
DROP POLICY IF EXISTS tourist_read_self_team ON public.tourist_team;
DROP POLICY IF EXISTS tourist_write_self_team ON public.tourist_team;

-- Create policies for tourist_team
CREATE POLICY admin_all_team ON public.tourist_team 
    FOR ALL TO authenticated 
    USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY tourist_read_self_team ON public.tourist_team 
    FOR SELECT TO authenticated 
    USING (auth.uid() = tourist_id);

CREATE POLICY tourist_write_self_team ON public.tourist_team 
    FOR ALL TO authenticated 
    USING (auth.uid() = tourist_id);
