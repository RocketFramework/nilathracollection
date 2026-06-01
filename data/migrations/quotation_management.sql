-- Migration: Add has_contracted_price column to supplier master tables
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS has_contracted_price BOOLEAN DEFAULT TRUE;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS has_contracted_price BOOLEAN DEFAULT TRUE;
ALTER TABLE public.transport_providers ADD COLUMN IF NOT EXISTS has_contracted_price BOOLEAN DEFAULT TRUE;
ALTER TABLE public.tour_guides ADD COLUMN IF NOT EXISTS has_contracted_price BOOLEAN DEFAULT TRUE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS has_contracted_price BOOLEAN DEFAULT TRUE;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS has_contracted_price BOOLEAN DEFAULT TRUE;

-- Create quotation_request table
CREATE TABLE IF NOT EXISTS public.quotation_request (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID, -- References hotels, vendors, transport_providers, tour_guides, drivers, restaurants
    vendor_name VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    email_content TEXT NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    replied_date TIMESTAMP WITH TIME ZONE,
    quoted_price NUMERIC(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'Sent', -- 'Pending', 'Sent', 'Replied', 'Declined', 'Expired', 'Selected'
    selected_vendor BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_activity_quotation_request mapping table
CREATE TABLE IF NOT EXISTS public.daily_activity_quotation_request (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_activity_id UUID REFERENCES public.daily_activities(id) ON DELETE CASCADE,
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
    itinerary_id UUID REFERENCES public.tour_itineraries(id) ON DELETE CASCADE,
    activity_type VARCHAR(50),
    quotation_request_id UUID REFERENCES public.quotation_request(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quotation_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity_quotation_request ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
DROP POLICY IF EXISTS admin_agent_all_quotation_request ON public.quotation_request;
CREATE POLICY admin_agent_all_quotation_request ON public.quotation_request
    FOR ALL TO authenticated USING (get_user_role(auth.uid()) IN ('admin', 'agent'));

DROP POLICY IF EXISTS admin_agent_all_daily_activity_quotation_request ON public.daily_activity_quotation_request;
CREATE POLICY admin_agent_all_daily_activity_quotation_request ON public.daily_activity_quotation_request
    FOR ALL TO authenticated USING (get_user_role(auth.uid()) IN ('admin', 'agent'));
