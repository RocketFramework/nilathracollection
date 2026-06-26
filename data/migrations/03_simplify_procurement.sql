-- 1. Add columns to tour_rfq_emails
ALTER TABLE public.tour_rfq_emails 
ADD COLUMN IF NOT EXISTS vendor_id UUID,
ADD COLUMN IF NOT EXISTS vendor_name TEXT,
ADD COLUMN IF NOT EXISTS vendor_type TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Sent',
ADD COLUMN IF NOT EXISTS quoted_price NUMERIC,
ADD COLUMN IF NOT EXISTS replied_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS selected_vendor BOOLEAN DEFAULT false;

-- 2. Add columns to tour_rfp_emails
ALTER TABLE public.tour_rfp_emails 
ADD COLUMN IF NOT EXISTS vendor_id UUID,
ADD COLUMN IF NOT EXISTS vendor_name TEXT,
ADD COLUMN IF NOT EXISTS vendor_type TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Sent',
ADD COLUMN IF NOT EXISTS quoted_price NUMERIC,
ADD COLUMN IF NOT EXISTS replied_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS selected_vendor BOOLEAN DEFAULT false;

-- 3. Losslessly migrate data from daily_activity_vendors to tour_rfq_emails
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_activity_vendors') THEN
        INSERT INTO public.tour_rfq_emails (
            id, tour_id, recipient_email, sender_email, subject, body_html, sent_at, sent_by, po_block_id,
            vendor_id, vendor_name, vendor_type, status, replied_date, quoted_price, notes, selected_vendor
        )
        SELECT 
            dav.id,
            COALESCE(
                dav.tour_id,
                (SELECT link.tour_id FROM public.daily_activity_vendor_links link WHERE link.daily_activity_vendor_id = dav.id LIMIT 1),
                (SELECT act.tour_id FROM public.daily_activities act 
                 JOIN public.daily_activity_vendor_links link ON link.daily_activity_id = act.id 
                 WHERE link.daily_activity_vendor_id = dav.id LIMIT 1)
            ) AS resolved_tour_id,
            dav.to_email, dav.from_email, dav.subject, dav.email_content, dav.created_at, dav.created_by, dav.po_block_id,
            dav.vendor_id, dav.vendor_name, dav.vendor_type, dav.status, dav.replied_date, dav.quoted_price, dav.notes, dav.selected_vendor
        FROM public.daily_activity_vendors dav
        WHERE COALESCE(
            dav.tour_id,
            (SELECT link.tour_id FROM public.daily_activity_vendor_links link WHERE link.daily_activity_vendor_id = dav.id LIMIT 1),
            (SELECT act.tour_id FROM public.daily_activities act 
             JOIN public.daily_activity_vendor_links link ON link.daily_activity_id = act.id 
             WHERE link.daily_activity_vendor_id = dav.id LIMIT 1)
        ) IS NOT NULL
        ON CONFLICT (id) DO UPDATE SET
            vendor_id = EXCLUDED.vendor_id,
            vendor_name = EXCLUDED.vendor_name,
            vendor_type = EXCLUDED.vendor_type,
            status = EXCLUDED.status,
            replied_date = EXCLUDED.replied_date,
            quoted_price = EXCLUDED.quoted_price,
            notes = EXCLUDED.notes,
            selected_vendor = EXCLUDED.selected_vendor;
    END IF;
END $$;

-- 4. Drop redundant daily_activity_vendor_links table
DROP TABLE IF EXISTS public.daily_activity_vendor_links CASCADE;

-- 5. Drop redundant daily_activity_vendors table
DROP TABLE IF EXISTS public.daily_activity_vendors CASCADE;

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
