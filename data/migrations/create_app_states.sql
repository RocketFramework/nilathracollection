-- Create app_states table for generic key-value state persistence across the app/website
CREATE TABLE IF NOT EXISTS public.app_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_key VARCHAR(255) UNIQUE NOT NULL,
    state_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for high performance lookups
CREATE INDEX IF NOT EXISTS idx_app_states_key ON public.app_states(state_key);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_states ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS authenticated_all_app_states ON public.app_states;

-- Create policies for app_states (allow all authenticated agents/admins to read and write state)
CREATE POLICY authenticated_all_app_states ON public.app_states
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
