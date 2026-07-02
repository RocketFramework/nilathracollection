-- 1. Create transport_requirements table
CREATE TABLE IF NOT EXISTS public.transport_requirements (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    vehicle_duration INTEGER,
    number_of_vehicles INTEGER DEFAULT 1,
    vehicle_make VARCHAR(255),
    vehicle_model_year DATE,
    leather_seats BOOLEAN DEFAULT FALSE,
    vehicle_color VARCHAR(100),
    vehicle_is_mint_condition BOOLEAN DEFAULT FALSE,
    chauffeur_required BOOLEAN DEFAULT TRUE,
    chauffeur_speak_english BOOLEAN DEFAULT TRUE,
    chauffeur_other_languages TEXT,
    chauffeur_accommodation_needed BOOLEAN DEFAULT FALSE,
    chauffeur_meal_needed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add transport_requirement_id column to daily_activities table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'daily_activities' AND column_name = 'transport_requirement_id'
    ) THEN
        ALTER TABLE public.daily_activities 
        ADD COLUMN transport_requirement_id UUID REFERENCES public.transport_requirements(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.transport_requirements ENABLE ROW LEVEL SECURITY;

-- 4. Add RLS Policies for transport_requirements
DROP POLICY IF EXISTS admin_agent_all_transport_requirements ON public.transport_requirements;
CREATE POLICY admin_agent_all_transport_requirements ON public.transport_requirements
    FOR ALL TO authenticated USING (get_user_role(auth.uid()) IN ('admin', 'agent', 'finance'));

-- 5. Seed Request for Quote - Transport email template
INSERT INTO public.email_templates (name, type, subject, body_html, variables)
SELECT 
    'Request for Quote - Transport',
    'RFQ_TRANSPORT',
    'Request for Quotation - Transport Services – {{Transport Provider Name}}',
    '<p>Dear Reservations / Transport Team,</p><p>Greetings from <strong>Nilathra Collection</strong>.</p><p>We are a Colombo–based destination management company specializing in tailor-made luxury, ultra-VIP, and experiential travel for HNW and UHNW international clientele. We are currently preparing a proposal for our guests and would appreciate your best rates and availability for transport services as detailed below:</p><ul><li><strong>Vehicle Make / Model requested:</strong> {{Vehicle Make}}</li><li><strong>Model Year / Manufacture:</strong> {{Model Year}}</li><li><strong>Number of Vehicles Needed:</strong> {{Number of Vehicles}}</li><li><strong>Vehicle Duration (Days):</strong> {{Vehicle Duration}}</li><li><strong>Total Estimated Kilometers:</strong> {{Total Km}} km</li></ul><p><strong>Additional & Special Requirements:</strong></p><ul><li><strong>Leather Seats:</strong> {{Leather Seats}}</li><li><strong>Vehicle Color:</strong> {{Vehicle Color}}</li><li><strong>Minimum/Mint Condition required:</strong> {{Mint Condition}}</li><li><strong>Chauffeur Required:</strong> {{Chauffeur Required}}</li><li><strong>English Speaking Chauffeur:</strong> {{English Speaking}}</li><li><strong>Other Languages Spoken:</strong> {{Other Languages}}</li><li><strong>Driver Accommodation:</strong> {{Driver Accommodation}}</li><li><strong>Driver Meal Price:</strong> {{Meal Price}}</li></ul><p>Kindly provide your best rates and confirm availability at your earliest convenience.</p><p>We look forward to your favorable response and hope this marks the beginning of a mutually beneficial partnership.</p><p>Warm regards,</p><p><strong>{{Agent Name}}</strong><br><strong>Senior Agent</strong><br><strong>Nilathra Collection</strong></p><p><strong>Nilathra Hotel Management (Pvt) Ltd</strong><br><strong>Mobile:</strong> +94 (0) 777 27 8282<br><strong>Email:</strong> concierge@nilathra.com<br><strong>Website:</strong> https://www.nilathra.com</p>',
    '["Transport Provider Name", "Vehicle Make", "Model Year", "Number of Vehicles", "Vehicle Duration", "Total Km", "Leather Seats", "Vehicle Color", "Mint Condition", "Chauffeur Required", "English Speaking", "Other Languages", "Driver Accommodation", "Meal Price", "Agent Name"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.email_templates WHERE name = 'Request for Quote - Transport'
);
