-- 1. Create po_blocks table
CREATE TABLE IF NOT EXISTS public.po_blocks (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    block_type VARCHAR(50) NOT NULL, -- 'accommodation', 'travel', 'restaurant', 'activity'
    block_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create po_block_daily_activities junction table
CREATE TABLE IF NOT EXISTS public.po_block_daily_activities (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    po_block_id UUID NOT NULL REFERENCES public.po_blocks(id) ON DELETE CASCADE,
    daily_activity_id UUID NOT NULL REFERENCES public.daily_activities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_po_block_activity UNIQUE (po_block_id, daily_activity_id)
);

-- 3. Add po_block_id column to target tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'daily_activity_vendors' AND column_name = 'po_block_id'
    ) THEN
        ALTER TABLE public.daily_activity_vendors 
        ADD COLUMN po_block_id UUID REFERENCES public.po_blocks(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'po_block_id'
    ) THEN
        ALTER TABLE public.purchase_orders 
        ADD COLUMN po_block_id UUID REFERENCES public.po_blocks(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'supplier_invoices' AND column_name = 'po_block_id'
    ) THEN
        ALTER TABLE public.supplier_invoices 
        ADD COLUMN po_block_id UUID REFERENCES public.po_blocks(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tour_rfq_emails' AND column_name = 'po_block_id'
    ) THEN
        ALTER TABLE public.tour_rfq_emails 
        ADD COLUMN po_block_id UUID REFERENCES public.po_blocks(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tour_rfp_emails' AND column_name = 'po_block_id'
    ) THEN
        ALTER TABLE public.tour_rfp_emails 
        ADD COLUMN po_block_id UUID REFERENCES public.po_blocks(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.po_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_block_daily_activities ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policies
DROP POLICY IF EXISTS admin_agent_all_po_blocks ON public.po_blocks;
CREATE POLICY admin_agent_all_po_blocks ON public.po_blocks
    FOR ALL TO authenticated USING (get_user_role(auth.uid()) IN ('admin', 'agent', 'finance'));

DROP POLICY IF EXISTS admin_agent_all_po_block_daily_activities ON public.po_block_daily_activities;
CREATE POLICY admin_agent_all_po_block_daily_activities ON public.po_block_daily_activities
    FOR ALL TO authenticated USING (get_user_role(auth.uid()) IN ('admin', 'agent', 'finance'));
