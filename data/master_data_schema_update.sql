-- 1. Create payment_details table
CREATE TABLE IF NOT EXISTS public.payment_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name VARCHAR(255),
    branch_name VARCHAR(255),
    account_name VARCHAR(255),
    account_number VARCHAR(255),
    swift_code VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for payment_details
ALTER TABLE public.payment_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_manage_payment_details ON public.payment_details FOR ALL TO authenticated USING (
    (SELECT name FROM roles JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = auth.uid() LIMIT 1) = 'admin'
);

-- 2. Create the robust generic vendors table (Replacing activity_vendors)
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    lat NUMERIC(10, 8),
    lng NUMERIC(11, 8),
    description TEXT,
    payment_detail_id UUID REFERENCES public.payment_details(id),
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_read_vendors_all ON public.vendors FOR SELECT TO authenticated USING (is_suspended = FALSE OR (SELECT name FROM roles JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = auth.uid() LIMIT 1) IN ('admin', 'agent'));
CREATE POLICY admin_manage_vendors ON public.vendors FOR ALL TO authenticated USING (
    (SELECT name FROM roles JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = auth.uid() LIMIT 1) = 'admin'
);


-- 3. Create the new structured activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category TEXT NOT NULL,
    activity_name TEXT NOT NULL,
    location_name TEXT NOT NULL,
    district TEXT NOT NULL,
    lat NUMERIC(10, 8),
    lng NUMERIC(11, 8),
    description TEXT NOT NULL,
    duration_hours NUMERIC(5, 2) NOT NULL,
    optimal_start_time TIME WITHOUT TIME ZONE,
    optimal_end_time TIME WITHOUT TIME ZONE,
    time_flexible BOOLEAN NOT NULL DEFAULT FALSE,
    price NUMERIC(10, 2) -- Added price column as requested
);

-- Enable RLS for activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_read_activities_new ON public.activities FOR SELECT USING (true);
CREATE POLICY admin_manage_activities_new ON public.activities FOR ALL TO authenticated USING (
    (SELECT name FROM roles JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = auth.uid() LIMIT 1) = 'admin'
);


-- 4. Create the mapping table vendor_activities
CREATE TABLE IF NOT EXISTS public.vendor_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    activity_id BIGINT REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
    vendor_price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id, activity_id)
);

-- Enable RLS for vendor_activities
ALTER TABLE public.vendor_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_read_vendor_activities ON public.vendor_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_manage_vendor_activities ON public.vendor_activities FOR ALL TO authenticated USING (
    (SELECT name FROM roles JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = auth.uid() LIMIT 1) = 'admin'
);


-- 5. Add payment_detail_id to existing tables
ALTER TABLE public.hotels ADD COLUMN payment_detail_id UUID REFERENCES public.payment_details(id);
ALTER TABLE public.drivers ADD COLUMN payment_detail_id UUID REFERENCES public.payment_details(id);
ALTER TABLE public.tour_guides ADD COLUMN payment_detail_id UUID REFERENCES public.payment_details(id);
ALTER TABLE public.transport_providers ADD COLUMN payment_detail_id UUID REFERENCES public.payment_details(id);

-- 6. Update daily_activities to link to new format
-- Note: You might need to drop the old constraints if they exist on vendor_id
-- We add activity_id (BIGINT) and change vendor_id to point to the new vendors table.
ALTER TABLE public.daily_activities ADD COLUMN activity_id BIGINT REFERENCES public.activities(id);

-- Depending on your existing DB state, if vendor_id is linked to activity_vendors, you need to drop it.
-- This script assumes vendor_id exists and points to activity_vendors. We'll drop it and recreate it.
DO $$ 
DECLARE 
    fk_name TEXT;
BEGIN
    SELECT conname INTO fk_name 
    FROM pg_constraint 
    WHERE conrelid = 'public.daily_activities'::regclass AND confrelid = 'public.activity_vendors'::regclass;
    
    IF fk_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.daily_activities DROP CONSTRAINT ' || fk_name;
    END IF;
END $$;

ALTER TABLE public.daily_activities DROP COLUMN vendor_id;
ALTER TABLE public.daily_activities ADD COLUMN vendor_id UUID REFERENCES public.vendors(id);

-- 7. Drop obsolete activity_vendors table (WARNING: This destroys old data)
DROP TABLE IF EXISTS public.activity_vendors CASCADE;
