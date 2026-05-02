-- SQL script to create the system_logs table for tracking interactions and errors.
-- Please run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level VARCHAR(50) NOT NULL, -- e.g., 'info', 'error', 'warn'
    action VARCHAR(255) NOT NULL, -- e.g., 'contact_page_inquiry_start', 'contact_page_inquiry_error'
    details JSONB, -- Stores the submitted form data or request context
    error_message TEXT, -- Stores the actual raw error message from the database or application
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index on level and action for faster querying
CREATE INDEX IF NOT EXISTS system_logs_level_idx ON public.system_logs (level);
CREATE INDEX IF NOT EXISTS system_logs_action_idx ON public.system_logs (action);
CREATE INDEX IF NOT EXISTS system_logs_created_at_idx ON public.system_logs (created_at DESC);

-- Enable Row Level Security (optional, depending on your setup)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Allow only authenticated admins to read the logs
CREATE POLICY "Allow admins to read logs" ON public.system_logs
    FOR SELECT TO authenticated
    USING ( (auth.jwt() ->> 'role') = 'admin' );

-- Note: Since the inserts are done via a service role key (createAdminClient), 
-- they will automatically bypass RLS policies for inserts. 

-- Create system_settings table for toggling features like page view tracking
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL
);

-- Seed the default setting for page view logging
INSERT INTO public.system_settings (key, value) 
VALUES ('log_page_views', 'true'::jsonb) 
ON CONFLICT DO NOTHING;
