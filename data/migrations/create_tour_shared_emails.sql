-- Create public.tour_shared_emails table
CREATE TABLE IF NOT EXISTS public.tour_shared_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.tour_shared_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_manage_shared_emails ON public.tour_shared_emails
    FOR ALL TO authenticated USING (true);
