-- SQL script to create the booking_terms table for managing terms and conditions per tier.
-- Please run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.booking_terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier VARCHAR(50) NOT NULL UNIQUE, -- 'premium', 'luxury', 'ultra_vip'
    booking_payment TEXT NOT NULL,
    cancellation_policy TEXT NOT NULL,
    important_notes TEXT NOT NULL,
    health_safety TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.booking_terms ENABLE ROW LEVEL SECURITY;

-- Allow public read access (if needed in tourist portals)
CREATE POLICY "Allow public read access" ON public.booking_terms
    FOR SELECT TO public
    USING (true);

-- Allow admins to manage terms
CREATE POLICY "Allow admins full access" ON public.booking_terms
    FOR ALL TO authenticated
    USING ( (auth.jwt() ->> 'role') = 'admin' )
    WITH CHECK ( (auth.jwt() ->> 'role') = 'admin' );

-- Insert initial records for the tiers
INSERT INTO public.booking_terms (tier, booking_payment, cancellation_policy, important_notes, health_safety)
VALUES 
('premium', 
'A 30% deposit is required to confirm your booking
Balance payment due 30 days prior to arrival
Payments accepted via bank transfer, credit card (3% fee applies), or PayPal
Prices quoted in USD but can be paid in LKR at prevailing exchange rate',
'More than 60 days before arrival: 10% cancellation fee
30-59 days before arrival: 30% cancellation fee
15-29 days before arrival: 50% cancellation fee
Less than 15 days: 100% cancellation fee (no refund)',
'Hotel accommodations are subject to availability at time of booking
Check-in time is typically 2:00 PM, check-out 12:00 PM
We strongly recommend comprehensive travel insurance
Modest dress required when visiting temples (shoulders and knees covered)
Itinerary may be adjusted due to weather, road conditions, or unforeseen circumstances
Hotels reserve the right to change room categories based on availability (similar standard guaranteed)',
'No vaccinations required for Sri Lanka from most countries
Bottled water recommended; available in vehicle daily
Travel insurance covering medical emergencies strongly advised'),

('luxury', 
'A 30% deposit is required to confirm your booking
Balance payment due 30 days prior to arrival
Payments accepted via bank transfer, credit card (3% fee applies), or PayPal
Prices quoted in USD but can be paid in LKR at prevailing exchange rate',
'More than 60 days before arrival: 10% cancellation fee
30-59 days before arrival: 30% cancellation fee
15-29 days before arrival: 50% cancellation fee
Less than 15 days: 100% cancellation fee (no refund)',
'Hotel accommodations are subject to availability at time of booking
Check-in time is typically 2:00 PM, check-out 12:00 PM
We strongly recommend comprehensive travel insurance
Modest dress required when visiting temples (shoulders and knees covered)
Itinerary may be adjusted due to weather, road conditions, or unforeseen circumstances
Hotels reserve the right to change room categories based on availability (similar standard guaranteed)',
'No vaccinations required for Sri Lanka from most countries
Bottled water recommended; available in vehicle daily
Travel insurance covering medical emergencies strongly advised'),

('ultra_vip', 
'A 30% deposit is required to confirm your booking
Balance payment due 30 days prior to arrival
Payments accepted via bank transfer, credit card (3% fee applies), or PayPal
Prices quoted in USD but can be paid in LKR at prevailing exchange rate',
'More than 60 days before arrival: 10% cancellation fee
30-59 days before arrival: 30% cancellation fee
15-29 days before arrival: 50% cancellation fee
Less than 15 days: 100% cancellation fee (no refund)',
'Hotel accommodations are subject to availability at time of booking
Check-in time is typically 2:00 PM, check-out 12:00 PM
We strongly recommend comprehensive travel insurance
Modest dress required when visiting temples (shoulders and knees covered)
Itinerary may be adjusted due to weather, road conditions, or unforeseen circumstances
Hotels reserve the right to change room categories based on availability (similar standard guaranteed)',
'No vaccinations required for Sri Lanka from most countries
Bottled water recommended; available in vehicle daily
Travel insurance covering medical emergencies strongly advised')
ON CONFLICT (tier) DO NOTHING;
