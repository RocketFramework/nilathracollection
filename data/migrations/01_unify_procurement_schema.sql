-- 1. Create daily_activity_vendors table
CREATE TABLE IF NOT EXISTS public.daily_activity_vendors (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
    vendor_id UUID, -- References hotels, vendors, transport_providers, tour_guides, drivers, restaurants
    vendor_type VARCHAR(50), -- 'hotel', 'vendor', 'transport_provider', 'tour_guide', 'driver', 'restaurant', etc.
    vendor_name VARCHAR(255) NOT NULL,
    to_email VARCHAR(255),
    from_email VARCHAR(255),
    subject VARCHAR(255),
    email_content TEXT,
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    replied_date TIMESTAMP WITH TIME ZONE,
    quoted_price NUMERIC(12, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'Sent', -- 'Pending', 'Sent', 'Replied', 'Declined', 'Expired', 'Selected', 'Confirmed', 'Cancelled'
    selected_vendor BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    booking_reference VARCHAR(100),
    cancellation_deadline TIMESTAMP WITH TIME ZONE,
    cancellation_policy TEXT
);

-- 2. Create daily_activity_vendor_links junction table
CREATE TABLE IF NOT EXISTS public.daily_activity_vendor_links (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    daily_activity_id UUID REFERENCES public.daily_activities(id) ON DELETE CASCADE,
    daily_activity_vendor_id UUID REFERENCES public.daily_activity_vendors(id) ON DELETE CASCADE,
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
    itinerary_id UUID REFERENCES public.tour_itineraries(id) ON DELETE CASCADE,
    activity_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_activity_vendor_link UNIQUE (daily_activity_id, daily_activity_vendor_id)
);

-- 3. Lossless Migration of data from quotation_request to daily_activity_vendors
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotation_request') THEN
        INSERT INTO public.daily_activity_vendors (
            id, vendor_id, vendor_name, to_email, from_email, subject, email_content,
            sent_date, replied_date, quoted_price, currency, status, selected_vendor, notes,
            created_by, created_at, updated_at
        )
        SELECT 
            id, vendor_id, vendor_name, to_email, from_email, subject, email_content,
            sent_date, replied_date, quoted_price, currency, status, selected_vendor, notes,
            created_by, created_at, updated_at
        FROM public.quotation_request
        ON CONFLICT (id) DO NOTHING;

        -- Update tour_id and vendor_type based on daily_activity_quotation_request mapping
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_activity_quotation_request') THEN
            UPDATE public.daily_activity_vendors dav
            SET 
                tour_id = COALESCE(dav.tour_id, (
                    SELECT DISTINCT daqr.tour_id 
                    FROM public.daily_activity_quotation_request daqr
                    WHERE daqr.quotation_request_id = dav.id
                    LIMIT 1
                )),
                vendor_type = COALESCE(dav.vendor_type, (
                    SELECT DISTINCT daqr.activity_type 
                    FROM public.daily_activity_quotation_request daqr
                    WHERE daqr.quotation_request_id = dav.id
                    LIMIT 1
                ));

            -- Migrate mappings into daily_activity_vendor_links
            INSERT INTO public.daily_activity_vendor_links (
                daily_activity_id, daily_activity_vendor_id, tour_id, itinerary_id, activity_type, created_at, updated_at
            )
            SELECT 
                daily_activity_id, quotation_request_id, tour_id, itinerary_id, activity_type, created_at, updated_at
            FROM public.daily_activity_quotation_request
            ON CONFLICT (daily_activity_id, daily_activity_vendor_id) DO NOTHING;
        END IF;

        -- Fallback: backfill tour_id and vendor_id from tour_rfq_emails if still NULL
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tour_rfq_emails') THEN
            UPDATE public.daily_activity_vendors dav
            SET 
                tour_id = COALESCE(dav.tour_id, (
                    SELECT DISTINCT tre.tour_id
                    FROM public.tour_rfq_emails tre
                    WHERE tre.quotation_request_id = dav.id
                    LIMIT 1
                )),
                vendor_id = COALESCE(dav.vendor_id, (
                    SELECT DISTINCT tre.vendor_id
                    FROM public.tour_rfq_emails tre
                    WHERE tre.quotation_request_id = dav.id AND tre.vendor_id IS NOT NULL
                    LIMIT 1
                ));
        END IF;

        -- Fallback: Infer vendor_type from vendor_id if still NULL by probing master tables
        UPDATE public.daily_activity_vendors dav
        SET vendor_type = CASE
            WHEN EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = dav.vendor_id) THEN 'hotel'
            WHEN EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = dav.vendor_id) THEN 'vendor'
            WHEN EXISTS (SELECT 1 FROM public.transport_providers tp WHERE tp.id = dav.vendor_id) THEN 'transport_provider'
            WHEN EXISTS (SELECT 1 FROM public.tour_guides tg WHERE tg.id = dav.vendor_id) THEN 'tour_guide'
            WHEN EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = dav.vendor_id) THEN 'driver'
            WHEN EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = dav.vendor_id) THEN 'restaurant'
            ELSE dav.vendor_type
        END
        WHERE dav.vendor_type IS NULL AND dav.vendor_id IS NOT NULL;
    END IF;
END $$;

-- 4. Update tour_rfq_emails table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'tour_rfq_emails' 
          AND column_name = 'quotation_request_id'
    ) THEN
        -- Drop old foreign key constraint
        ALTER TABLE public.tour_rfq_emails 
        DROP CONSTRAINT IF EXISTS tour_rfq_emails_quotation_request_id_fkey;

        -- Rename column if needed
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'tour_rfq_emails' 
              AND column_name = 'daily_activity_vendor_id'
        ) THEN
            ALTER TABLE public.tour_rfq_emails 
            RENAME COLUMN quotation_request_id TO daily_activity_vendor_id;
        END IF;

        -- Add new foreign key constraint
        ALTER TABLE public.tour_rfq_emails 
        ADD CONSTRAINT tour_rfq_emails_daily_activity_vendor_id_fkey 
        FOREIGN KEY (daily_activity_vendor_id) REFERENCES public.daily_activity_vendors (id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Update purchase_orders table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'purchase_orders' 
          AND column_name = 'quotation_request_id'
    ) THEN
        -- Drop old foreign key constraint
        ALTER TABLE public.purchase_orders 
        DROP CONSTRAINT IF EXISTS purchase_orders_quotation_request_id_fkey;

        -- Rename column if needed
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'purchase_orders' 
              AND column_name = 'daily_activity_vendor_id'
        ) THEN
            ALTER TABLE public.purchase_orders 
            RENAME COLUMN quotation_request_id TO daily_activity_vendor_id;
        END IF;

        -- Add new foreign key constraint
        ALTER TABLE public.purchase_orders 
        ADD CONSTRAINT purchase_orders_daily_activity_vendor_id_fkey 
        FOREIGN KEY (daily_activity_vendor_id) REFERENCES public.daily_activity_vendors (id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.daily_activity_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity_vendor_links ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS Policies
DROP POLICY IF EXISTS admin_agent_all_daily_activity_vendors ON public.daily_activity_vendors;
CREATE POLICY admin_agent_all_daily_activity_vendors ON public.daily_activity_vendors
    FOR ALL TO authenticated USING (get_user_role(auth.uid()) IN ('admin', 'agent', 'finance'));

DROP POLICY IF EXISTS admin_agent_all_daily_activity_vendor_links ON public.daily_activity_vendor_links;
CREATE POLICY admin_agent_all_daily_activity_vendor_links ON public.daily_activity_vendor_links
    FOR ALL TO authenticated USING (get_user_role(auth.uid()) IN ('admin', 'agent', 'finance'));

-- 8. Drop obsolete tables if they exist
DROP TABLE IF EXISTS public.daily_activity_quotation_request;
DROP TABLE IF EXISTS public.quotation_request;
DROP TABLE IF EXISTS public.vendor_booked_activities;
DROP TABLE IF EXISTS public.vendor_bookings;
