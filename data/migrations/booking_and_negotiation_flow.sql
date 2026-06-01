-- Migration: Integrated Negotiation, Parallel Booking, and Finance Flow
-- Enables creating parallel bookings/reservations for itinerary activities, raising POs, and tracking invoices/payments.

-- 1. Add driver_id to purchase_orders (to support driver bookings & POs)
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.drivers(id);

-- 2. Create the vendor_bookings table
CREATE TABLE IF NOT EXISTS public.vendor_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    quotation_request_id UUID REFERENCES public.quotation_request(id) ON DELETE SET NULL,
    purchase_order_id UUID, -- Back-reference, linked properly below or dynamically in code
    
    -- Polymorphic Vendor reference fields
    vendor_type VARCHAR(50) NOT NULL, -- 'hotel', 'vendor', 'transport_provider', 'tour_guide', 'driver', 'restaurant'
    vendor_id UUID NOT NULL, -- UUID of the referenced supplier (hotels, vendors, transport_providers, tour_guides, drivers, restaurants)
    vendor_name VARCHAR(255) NOT NULL,
    
    -- Booking Details
    booking_reference VARCHAR(100), -- Reference/confirmation number from supplier
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Cancelled', 'Went Ahead'
    
    -- Financials 
    agreed_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Cancellation Terms
    cancellation_deadline TIMESTAMP WITH TIME ZONE, -- Crucial for contract checking
    cancellation_policy TEXT,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add vendor_booking_id to purchase_orders
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS vendor_booking_id UUID REFERENCES public.vendor_bookings(id) ON DELETE SET NULL;

-- 4. Add foreign key from vendor_bookings to purchase_orders
ALTER TABLE public.vendor_bookings
ADD CONSTRAINT fk_vendor_bookings_po
FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;

-- 5. Create the vendor_booked_activities junction table
CREATE TABLE IF NOT EXISTS public.vendor_booked_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_booking_id UUID REFERENCES public.vendor_bookings(id) ON DELETE CASCADE NOT NULL,
    daily_activity_id UUID REFERENCES public.daily_activities(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate mappings
    UNIQUE(vendor_booking_id, daily_activity_id)
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.vendor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_booked_activities ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS Policies
DROP POLICY IF EXISTS admin_agent_all_vendor_bookings ON public.vendor_bookings;
CREATE POLICY admin_agent_all_vendor_bookings ON public.vendor_bookings
    FOR ALL TO authenticated USING (get_user_role(auth.uid()) IN ('admin', 'agent'));

DROP POLICY IF EXISTS admin_agent_all_vendor_booked_activities ON public.vendor_booked_activities;
CREATE POLICY admin_agent_all_vendor_booked_activities ON public.vendor_booked_activities
    FOR ALL TO authenticated USING (get_user_role(auth.uid()) IN ('admin', 'agent'));

-- 8. Performance Indices
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_tour ON public.vendor_bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_vendor ON public.vendor_bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_quote ON public.vendor_bookings(quotation_request_id);
CREATE INDEX IF NOT EXISTS idx_booked_activities_booking ON public.vendor_booked_activities(vendor_booking_id);
CREATE INDEX IF NOT EXISTS idx_booked_activities_activity ON public.vendor_booked_activities(daily_activity_id);
