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
    '<p>Dear Reservations Team,</p>\n<p>Greetings from <strong>Nilathra Collection</strong>.</p>\n<p>Please provide your best rates and availability for the transport services detailed below:</p>\n<ul>\n  <li><strong>Vehicle:</strong> {{Vehicle Make}} (Model Year: {{Model Year}})</li>\n  <li><strong>Quantity & Duration:</strong> {{Number of Vehicles}} vehicle(s) for {{Vehicle Duration}} day(s)</li>\n  <li><strong>Estimated Distance:</strong> {{Total Km}} km</li>\n  <li><strong>Preferences:</strong> Leather Seats: {{Leather Seats}} | Color: {{Vehicle Color}} | Mint Condition: {{Mint Condition}}</li>\n  <li><strong>Chauffeur:</strong> Required: {{Chauffeur Required}} | English Speaking: {{English Speaking}} (Other: {{Other Languages}})</li>\n  <li><strong>Allowances:</strong> Driver Accommodation: {{Driver Accommodation}} | Meal Rate: {{Meal Price}}</li>\n</ul>\n<p>We look forward to your prompt response.</p>\n<p>Warm regards,</p>\n<p><strong>{{Agent Name}}</strong><br/>Nilathra Collection Concierge Team<br/>concierge@nilathra.com | +94 777 27 8282</p>',
    '["Transport Provider Name", "Vehicle Make", "Model Year", "Number of Vehicles", "Vehicle Duration", "Total Km", "Leather Seats", "Vehicle Color", "Mint Condition", "Chauffeur Required", "English Speaking", "Other Languages", "Driver Accommodation", "Meal Price", "Agent Name"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.email_templates WHERE name = 'Request for Quote - Transport'
);
