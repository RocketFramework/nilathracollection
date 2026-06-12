-- SQL Migration for Draft Itinerary Versions and Locking Concurrency Control

-- 1. Create draft_itinerary_versions table
CREATE TABLE IF NOT EXISTS public.draft_itinerary_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    label VARCHAR(255),
    itinerary_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parent_version_id UUID REFERENCES public.draft_itinerary_versions(id) ON DELETE SET NULL,
    UNIQUE (tour_id, version_number)
);

-- Index for ordering by version_number desc
CREATE INDEX IF NOT EXISTS idx_draft_itin_tour_version ON public.draft_itinerary_versions(tour_id, version_number DESC);

-- 2. Create itinerary_locks table
CREATE TABLE IF NOT EXISTS public.itinerary_locks (
    tour_id UUID PRIMARY KEY REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    locked_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.draft_itinerary_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_locks ENABLE ROW LEVEL SECURITY;

-- 4. Set policies for draft_itinerary_versions
DROP POLICY IF EXISTS admin_all_drafts ON public.draft_itinerary_versions;
DROP POLICY IF EXISTS agent_manage_drafts ON public.draft_itinerary_versions;
DROP POLICY IF EXISTS tourist_read_drafts ON public.draft_itinerary_versions;

CREATE POLICY admin_all_drafts ON public.draft_itinerary_versions FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY agent_manage_drafts ON public.draft_itinerary_versions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tours WHERE id = draft_itinerary_versions.tour_id AND agent_id = auth.uid())
);
CREATE POLICY tourist_read_drafts ON public.draft_itinerary_versions FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tours WHERE id = draft_itinerary_versions.tour_id AND tourist_id = auth.uid())
);

-- 5. Set policies for itinerary_locks
DROP POLICY IF EXISTS admin_all_locks ON public.itinerary_locks;
DROP POLICY IF EXISTS agent_manage_locks ON public.itinerary_locks;
DROP POLICY IF EXISTS tourist_read_locks ON public.itinerary_locks;

CREATE POLICY admin_all_locks ON public.itinerary_locks FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY agent_manage_locks ON public.itinerary_locks FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tours WHERE id = itinerary_locks.tour_id AND agent_id = auth.uid())
);
CREATE POLICY tourist_read_locks ON public.itinerary_locks FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tours WHERE id = itinerary_locks.tour_id AND tourist_id = auth.uid())
);
