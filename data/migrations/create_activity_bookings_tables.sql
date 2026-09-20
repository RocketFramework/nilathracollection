-- Create activity_bookings header table and activity_booking_items detail table

CREATE TABLE IF NOT EXISTS public.activity_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    tourist_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    total_price NUMERIC(10, 2), -- Set by Admin upon confirmation
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'Pending Assignment', -- 'Pending Assignment', 'Assigned', 'Confirmed', 'Completed', 'Cancelled'
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_booking_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.activity_bookings(id) ON DELETE CASCADE NOT NULL,
    activity_id BIGINT REFERENCES public.activities(id) ON DELETE RESTRICT NOT NULL,
    booking_date DATE NOT NULL,
    preferred_time_slot VARCHAR(50),
    adults INTEGER DEFAULT 1,
    children INTEGER DEFAULT 0,
    infants INTEGER DEFAULT 0,
    item_price NUMERIC(10, 2), -- Customer item price set by Admin
    status VARCHAR(50) DEFAULT 'Pending Assignment',
    assigned_vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    agreed_vendor_price NUMERIC(10, 2),
    assigned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.activity_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_booking_items ENABLE ROW LEVEL SECURITY;

-- Header policies
DROP POLICY IF EXISTS public_read_own_activity_bookings ON public.activity_bookings;
CREATE POLICY public_read_own_activity_bookings ON public.activity_bookings FOR SELECT USING (
    auth.uid() = tourist_id OR 
    (SELECT name FROM roles JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = auth.uid() LIMIT 1) IN ('admin', 'agent')
);

DROP POLICY IF EXISTS admin_manage_activity_bookings ON public.activity_bookings;
CREATE POLICY admin_manage_activity_bookings ON public.activity_bookings FOR ALL TO authenticated USING (
    (SELECT name FROM roles JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = auth.uid() LIMIT 1) = 'admin'
);

-- Items policies
DROP POLICY IF EXISTS public_read_own_activity_booking_items ON public.activity_booking_items;
CREATE POLICY public_read_own_activity_booking_items ON public.activity_booking_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.activity_bookings 
        WHERE id = activity_booking_items.booking_id 
        AND (tourist_id = auth.uid() OR (SELECT name FROM roles JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = auth.uid() LIMIT 1) IN ('admin', 'agent'))
    )
);

DROP POLICY IF EXISTS admin_manage_activity_booking_items ON public.activity_booking_items;
CREATE POLICY admin_manage_activity_booking_items ON public.activity_booking_items FOR ALL TO authenticated USING (
    (SELECT name FROM roles JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = auth.uid() LIMIT 1) = 'admin'
);
